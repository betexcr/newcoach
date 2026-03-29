import { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
} from "react-native";
import { Text, useTheme, Avatar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import { AuthInput } from "@/components/AuthInput";
import { AuthButton } from "@/components/AuthButton";

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(
    profile?.avatar_url ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const profileSynced = useRef(!!profile);

  useEffect(() => {
    if (profile && !profileSynced.current) {
      profileSynced.current = true;
      setFullName(profile.full_name ?? "");
      setAvatarUri(profile.avatar_url ?? null);
    }
  }, [profile]);

  async function pickImage() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("auth.permissionNeeded"),
          t("auth.permissionCameraRoll")
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert(t("common.error"), t("common.errorGeneric"));
    }
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!avatarUri || avatarUri === profile?.avatar_url || !profile?.id) {
      return profile?.avatar_url ?? null;
    }

    const ext = avatarUri.split(".").pop() ?? "jpg";
    const mime = ext.toLowerCase() === "jpg" ? "jpeg" : ext.toLowerCase();
    const fileName = `${profile.id}/avatar.${ext}`;

    const response = await fetch(avatarUri);
    if (!response.ok) throw new Error("UPLOAD_FETCH_FAILED");
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, blob, { upsert: true, contentType: `image/${mime}` });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSave() {
    if (!fullName.trim()) {
      setError(t("auth.enterName"));
      return;
    }

    if (!profile?.id) return;

    setLoading(true);
    setError("");

    try {
      let avatarUrl = profile.avatar_url;
      if (avatarUri && avatarUri !== profile.avatar_url) {
        avatarUrl = await uploadAvatar();
      }

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          avatar_url: avatarUrl,
        })
        .eq("id", profile.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setProfile(data);
      router.back();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.failedUpdateProfile"));
    } finally {
      setLoading(false);
    }
  }

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel={t("common.back")} accessibilityRole="button">
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.onSurface}
          />
        </Pressable>
        <Text
          variant="titleLarge"
          style={{ color: theme.colors.onSurface, fontWeight: "700" }}
        >
          {t("auth.editProfile")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.avatarSection} onPress={pickImage}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Avatar.Text
              size={100}
              label={initials}
              style={{ backgroundColor: theme.colors.primaryContainer }}
              labelStyle={{ color: theme.colors.primary, fontSize: 36 }}
            />
          )}
          <View
            style={[
              styles.editBadge,
              { backgroundColor: theme.colors.primary, borderColor: theme.colors.background },
            ]}
          >
            <MaterialCommunityIcons name="camera" size={18} color={theme.colors.onPrimary} />
          </View>
        </Pressable>

        <Text
          variant="bodyMedium"
          style={{
            color: theme.colors.onSurfaceVariant,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          {t("auth.tapPhotoToChange")}
        </Text>

        <AuthInput
          label={t("auth.fullName")}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          left={<AuthInput.Icon icon="account-outline" />}
        />

        <AuthInput
          label={t("auth.email")}
          value={profile?.email ?? ""}
          disabled
          left={<AuthInput.Icon icon="email-outline" />}
        />

        {error ? (
          <Text style={[styles.error, { color: theme.colors.error }]}>
            {error}
          </Text>
        ) : null}

        <AuthButton
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.saveButton}
        >
          {t("auth.saveChanges")}
        </AuthButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  avatarSection: {
    position: "relative",
    marginBottom: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
  },
  error: {
    textAlign: "center",
    marginVertical: 8,
    fontSize: 14,
  },
  saveButton: {
    marginTop: 16,
    width: "100%",
  },
});
