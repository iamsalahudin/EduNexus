// this is deomi

const React = require('react');
const ReactDOM = require('react-dom');

module.exports = {
  render: function(component, containerId) {
    const container = document.getElementById(containerId);
    ReactDOM.render(component, container);
    }
};