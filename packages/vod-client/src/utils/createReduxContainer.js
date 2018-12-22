import { connect } from 'react-redux';
import toJS from './toJS';

export default function createReduxContainer(Component, mapStateToProps, mapDispatchToProps) {
  return connect(
    mapStateToProps,
    mapDispatchToProps,
  )(toJS(Component));
}
