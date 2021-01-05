import { createElement } from 'react';
import { render } from 'react-dom';
import { App } from './app-component';
const root = document.getElementById('app');

import './test.css';

if (root) {
    render(<App/>, root);
}
//
// setTimeout(() => {
//     import('./lazy');
// }, 1000);
//
