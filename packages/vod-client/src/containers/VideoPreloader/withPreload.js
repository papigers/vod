import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { preload } from './actions';

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

const withPreload = WrappedComponent => {
  const mapDispatchToProps = dispatch => {
    return bindActionCreators(
      {
        preload,
      },
      dispatch,
    );
  };

  const WithPreload = connect(
    null,
    mapDispatchToProps,
  )(WrappedComponent);
  WithPreload.displayName = `WithPreload(${getDisplayName(WrappedComponent)})`;
  return WithPreload;
};

export default withPreload;
