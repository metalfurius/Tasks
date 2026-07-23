# Taskify

A modern, responsive task management web application with multiple views, themes, and collaborative features.

## Features

- **Intuitive Task Management**: Create, edit, and delete tasks with ease
- **Multiple Views**: Home, Calendar, Kanban, and Collaboration modes
- **Task Organization**: Drag and drop functionality for task prioritization
- **Themes**: Light and dark mode support
- **Multilingual Support**: Available in English, Spanish, and French
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Google Authentication**: Secure user login with Google
- **Task History**: Keep track of completed tasks and activity history

## Usage

1. Sign in using your Google account
2. Add new tasks with optional due dates
3. Manage tasks across different views (Home, Calendar, Kanban)
4. Toggle between light and dark themes
5. Change language settings as needed
6. Collaborate with team members on shared tasks

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Rendering security boundary

Task titles, descriptions, search terms, history entries, and toast messages are rendered as text nodes. The application does not accept rich text, Markdown, or user-authored HTML.

The `_headers` file is defense-in-depth for hosts that explicitly support that convention; it is not the primary fix. GitHub Pages publishes the selected repository source and does not document `_headers` as a per-file response-header configuration. The [GitHub Pages publishing documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [MIME-type documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site#mime-types-on-github-pages) describe the supported boundary. Live validation must therefore verify inert rendering and the actual deployed revision; missing or unavailable response headers do not make unsafe DOM construction acceptable.

At the 2026-07-23 audit, the Pages API reported the legacy `main`-root deployment at `https://codeoverdose.es/Tasks/`. A synthetic `HEAD` request returned `200`, `X-Frame-Options: SAMEORIGIN`, and no `Content-Security-Policy`; the committed `_headers` values were therefore not treated as an effective GitHub Pages control.

Security regression commands:

```text
npm run check
npm run test:browser
npm run test:emulator
npm run audit:dependencies
```

`npm run test:emulator` starts only the local Firestore emulator with the disposable project ID `tasks-untrusted-test`, writes synthetic task/history documents, verifies exact Firestore round trips, and renders the returned values through the text-only DOM helpers. It does not use authentication, production data, or a production Firebase project.

## License and Copyright

© [metalfurius] 2025. All Rights Reserved.

This project is licensed for personal and educational use only.

### Restrictions:
- Commercial use is strictly prohibited without explicit permission
- Redistribution of this software in source or binary forms is not permitted without prior written consent
- Derivative works based on this software are not permitted without prior written consent

### Permissions:
- Personal use
- Educational use
- Non-commercial research and development

## Acknowledgments

- [SortableJS](https://github.com/SortableJS/Sortable) for drag-and-drop functionality
- [Google Fonts](https://fonts.google.com/) for typography
- All contributors and testers who have helped improve this project
