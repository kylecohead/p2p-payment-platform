# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Global Styles

Project-wide CSS variables, resets, utility classes, and base component styles live in `src/global.css`.

Guidelines:
1. Keep only generic, reusable styles here.
2. Avoid page specific or feature specific selectors; those belong in co located component/page CSS files.
3. Prefer using CSS variables defined in `:root` for colors, spacing, and typography instead of hard coded values.
4. If adding new variables, group them logically and include a short comment for clarity.
5. When removing or renaming a variable, search the codebase to update usages of that variable. and replace if need be.

Example usage:
```jsx
<div className="container">
	<h1>Dashboard</h1>
	<div className="card">
		<p className="text-muted">Welcome back.</p>
	</div>
	<button className="btn">Primary Action</button>
</div>
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
