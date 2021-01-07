// regular imports
import { createElement } from 'react';
import { render } from 'react-dom';

// simple react code
const root = document.createElement('div');
document.body.append(root)
render(<div>Hello word</div>, root);
