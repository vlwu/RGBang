import { render } from 'lit';
import './components/rgbang-ui.js';

const uiRoot = document.getElementById('ui-root');

if (uiRoot) {
  render(
    document.createElement('rgbang-ui'),
    uiRoot
  );
} else {
  console.error('UI Root element #ui-root not found. UI cannot be initialized.');
}