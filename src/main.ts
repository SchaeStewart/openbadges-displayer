import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		src: './badge.png'
	}
});

export default app;