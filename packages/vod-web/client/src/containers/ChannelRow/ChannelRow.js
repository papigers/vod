import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Flex, Box } from 'grid-styled';
import styled from 'styled-components';
import { createStructuredSelector } from 'reselect';
import { bindActionCreators } from 'redux';

import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Shimmer, ShimmerElementType as ElemType, ShimmerElementsGroup } from 'office-ui-fabric-react/lib/Shimmer';

import createReduxContainer from 'utils/createReduxContainer';

import { makeSelectUser } from 'containers/ChannelPage/selectors';
import * as actions from './actions';

const FlexGrow = styled(Box)`
  flex-grow: 1;
`;

class ChannelRow extends Component {
  constructor() {
    super();
    this.state = {
      followDelta: 0,
    };
  }

  onFollow = () => {
    this.setState({ followDelta: this.state.followDelta + 1 });
    this.props.followChannel(this.props.channel.id);
  }

  onUnfollow = () => {
    this.setState({ followDelta: this.state.followDelta - 1 });
    this.props.unfollowChannel(this.props.channel.id);
  }

  render() {
    const { channel, user, size } = this.props;
    const { followDelta } = this.state;

    let userFollows = false;
    if (channel) {
      userFollows = (channel.isFollowing && followDelta >= 0) || (!channel.isFollowing && followDelta > 0);
    }

    return (
      <Shimmer
        className={this.props.className}
        customElementsGroup={(
          <Box width={1}>
            <Flex>
              <ShimmerElementsGroup
                shimmerElements={[
                  { type: ElemType.circle, height: 100 },
                  { type: ElemType.gap, width: 16, height: 100 }
                ]}
              />
              <ShimmerElementsGroup
                flexWrap
                width={'calc(100% - 200px)'}
                shimmerElements={[
                  { type: ElemType.gap, width: '100%', height: 25 },
                  { type: ElemType.line, width: '50%', height: 20 },
                  { type: ElemType.gap, width: '50%', height: 20 },
                  { type: ElemType.line, width: '30%', height: 16 },
                  { type: ElemType.gap, width: '70%', height: 16 },
                  { type: ElemType.gap, width: '100%', height: 25 },
                ]}
              />
              <ShimmerElementsGroup
                width={100}
                flexWrap
                shimmerElements={[
                  { type: ElemType.gap, width: '100%', height: 33.5 },
                  { type: ElemType.line, width: '100%', height: 30 },
                  { type: ElemType.gap, width: '100%', height: 33.5 }
                ]}
              />
            </Flex>
          </Box>
        )}
        width="100%"
        isDataLoaded={!!channel}
      >
        {channel && (
          <Flex alignItems="center" justifyContent="space-between">
            <FlexGrow>
              <Link to={`/channel/${channel.id}`}>
                <Persona
                  imageUrl={`/profile/${channel.id}/profile.png`}
                  primaryText={channel.name}
                  secondaryText={channel.description}
                  size={PersonaSize[`size${size}`]}
                />
              </Link>
            </FlexGrow>
            <Box ml={16}>
              {channel && user.id !== channel.id ? (
                <PrimaryButton
                  text={userFollows ? 'עוקב' : 'עקוב'}
                  iconProps={{ iconName: userFollows ? 'UserFollowed' : 'FollowUser' }}
                  onClick={userFollows ? this.onUnfollow : this.onFollow}
                />
              ) : null}
            </Box>
          </Flex>
        )}
      </Shimmer>
    );
  }
}

ChannelRow.defaultProps = {
  size: 100,
};

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(actions, dispatch);
};

export default createReduxContainer(ChannelRow, mapStateToProps, mapDispatchToProps);
