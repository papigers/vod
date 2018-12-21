import React, { Component } from 'react';
import { Iterable } from 'immutable';

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

const toJS = WrappedComponent => {
  class ToJS extends Component {
    render() {
      const KEY = 0;
      const VALUE = 1;

      const propsJS = Object.entries(this.props).reduce((newProps, wrappedComponentProp) => {
        newProps[wrappedComponentProp[KEY]] = Iterable.isIterable(wrappedComponentProp[VALUE])
          ? wrappedComponentProp[VALUE].toJS()
          : wrappedComponentProp[VALUE];
        return newProps;
      }, {});

      return <WrappedComponent {...propsJS} />;
    }
  }
  ToJS.displayName = `ToJS(${getDisplayName(WrappedComponent)})`;
  return ToJS;
};

export default toJS;
