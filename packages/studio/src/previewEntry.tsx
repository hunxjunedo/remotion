import React from 'react';
// eslint-disable-next-line react/no-deprecated
import type {render} from 'react-dom';
import ReactDOM from 'react-dom/client';
import {Internals} from 'remotion';
import {NoReactInternals} from 'remotion/no-react';
import {Studio} from './Studio';
import {NoRegisterRoot} from './components/NoRegisterRoot';
import {startErrorOverlay} from './error-overlay/entry-basic';
import {enableHotMiddleware} from './hot-middleware-client/client';

Internals.CSSUtils.injectCSS(
	Internals.CSSUtils.makeDefaultPreviewCSS(null, '#1f2428'),
);

let root: ReturnType<typeof ReactDOM.createRoot> | null = null;

const getRootForElement = () => {
	if (root) {
		return root;
	}

	root = ReactDOM.createRoot(Internals.getPreviewDomElement() as HTMLElement);
	return root;
};

const renderToDOM = (content: React.ReactElement) => {
	if (!ReactDOM.createRoot) {
		if (NoReactInternals.ENABLE_V5_BREAKING_CHANGES) {
			throw new Error(
				'Remotion 5.0 does only support React 18+. However, ReactDOM.createRoot() is undefined.',
			);
		}

		(ReactDOM as unknown as {render: typeof render}).render(
			content,
			Internals.getPreviewDomElement(),
		);
		return;
	}

	getRootForElement().render(content);
};

renderToDOM(<NoRegisterRoot />);

Internals.waitForRoot((NewRoot) => {
	renderToDOM(<Studio readOnly={false} rootComponent={NewRoot} />);
});

startErrorOverlay();
enableHotMiddleware();
