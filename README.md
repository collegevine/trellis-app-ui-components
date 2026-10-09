# @collegevine/trellis-app-ui-components

UI components for Trellis Apps: the shared building blocks that every
agent-built app draws its controls from. The deploy-app skill in
[trellis-agent-skills](https://github.com/collegevine/trellis-agent-skills)
installs this package and holds the design guide that says which component to
use and when.

## API reference

The API reference is generated from the source and published at
<https://collegevine.github.io/trellis-app-ui-components/index.md>. It lists
every component and helper, with what each one accepts.

## Install

```bash
npm install github:collegevine/trellis-app-ui-components
```

Tailwind does not read installed packages by default. Add this line to the
app's stylesheet, after the Tailwind import, or the components render without
their styles:

```css
@source "../node_modules/@collegevine/trellis-app-ui-components";
```

## Development

```bash
npm install
npm run typecheck
npm test
npm run docs
```

Every push to `main` rebuilds the API reference and publishes it to GitHub
Pages. Apps take the newest `main` at their next deployment, so a change here
reaches every app that redeploys. Change an existing component's behavior or
look only to fix it. A redesign ships as a new option or a new component.
