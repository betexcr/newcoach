import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        <title>NewCoach — App de Coaching Fitness</title>
        <meta
          name="description"
          content="Entrenamientos, nutrición, hábitos y mensajería coach-cliente. iOS, Android y Web."
        />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://newcoach.vercel.app" />
        <meta property="og:title" content="NewCoach — App de Coaching Fitness" />
        <meta
          property="og:description"
          content="Entrenamientos, nutrición, hábitos y mensajería coach-cliente. iOS, Android y Web."
        />
        <meta
          property="og:image"
          content="https://newcoach.vercel.app/og-image.png"
        />
        <meta property="og:image:width" content="1376" />
        <meta property="og:image:height" content="768" />
        <meta property="og:locale" content="es_MX" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NewCoach — App de Coaching Fitness" />
        <meta
          name="twitter:description"
          content="Entrenamientos, nutrición, hábitos y mensajería coach-cliente. iOS, Android y Web."
        />
        <meta
          name="twitter:image"
          content="https://newcoach.vercel.app/og-image.png"
        />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
