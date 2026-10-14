# Torvik Interface

The interface uses deep blue (`#0c1727`), blue surfaces (`#142338`), and orange
(`#ff914d`) for primary actions. Inter and Archivo remain the existing fonts.
Tokens, controls, and layouts are defined in `src/styles.css`.

`TorvikUI.tsx` brings together branding, the responsive mascot, headings, and
loading states. Main navigation retains Train ("Treinar"), Progress ("Progresso"),
and Settings ("Ajustes"): at the bottom on mobile and in the header from 768 px
upward. Preparation, workouts, and reports occupy a dedicated area.

## Screens and States

| Area        | Preserved screens and states                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Access      | Sign-in, basic sign-up, recovery, new password, password visibility, submission, error, success, and guest mode                            |
| Train       | Welcome, four categories, search with and without results, selection, demonstrations, instructions, and details for all 30 exercises       |
| Camera      | Model and video loading, permission requests and denials, errors, retry, camera selection, and positioning                                 |
| Workout     | Preparation, automatic and manual start, countdown, repetitions, holds, feedback, pause, resume, voice, sides, and discard confirmation    |
| Results     | Session without movements, repetitions, holds, results by side, points to review, save, error, success, export, and exit without saving    |
| Progress    | Loading, error, empty state, local summaries, filters, sorting, more sessions, charts, calendar, details, comparison, export, and deletion |
| Settings    | Account or guest, sign-out, voice, volume, camera help, and privacy                                                                        |
| Other pages | Page not found, loading error, SSR fallback, and the experimental lab (enabled or disabled)                                                |

Navigation gestures preserve selection and list positions. Dialogs use the
existing Radix components or the native category dialog. Primary controls are
48–54 px tall; fields keep a 16 px font for readability and mobile keyboards.
Voice controls use columns that can shrink and place volume on its own row to
accommodate enlarged text. Styles account for safe areas, landscape orientation,
enlarged text, visible focus, and reduced motion. Category animations last
180–240 ms and are omitted when reduced motion is enabled; demonstrations use
the existing still images.

## Data and Limitations

The redesign does not change the pose engines, rules, session clock, Supabase, or
storage. Sign-up still grants immediate access when email confirmation is disabled
in Supabase. History is local and separated by user; guest records remain in the
original database. There is no session synchronization, new metrics, saved videos,
or social features.

Browser tests use a synthetic camera and controlled estimators. Responsive checks
in Chromium do not replace real camera testing on iOS and Android.
