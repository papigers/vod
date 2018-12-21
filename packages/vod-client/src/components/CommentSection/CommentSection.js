import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { Flex, Box } from 'grid-styled';
import Waypoint from 'react-waypoint';

import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import Comment from 'components/VideoComment';

const CommentButton = styled(DefaultButton)`
  margin-right: 15px;
  margin-top: 13px;
`;

const CommentPersona = styled(Persona)`
  margin-top: 13px;
`;

const VideoComment = styled(Comment)`
  margin-bottom: 1.5em;
`;

const Section = styled(Box).attrs({
  px: 20,
  py: '8px',
})([]);

const NoComments = styled.div`
  text-align: center;
  font-size: 1.1em;
  display: ${({ loading }) => (loading ? 'none' : 'block')};
`;

class CommentSection extends Component {
  constructor() {
    super();
    this.state = {
      comment: '',
      comments: [],
      loading: true,
      newComments: [],
    };
  }

  componentDidMount() {
    // this.fetchComments();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.commentableId !== this.props.commentableId) {
      this.setState({
        comments: [],
        loading: true,
      });
      // }, this.fetchComments);
    }
  }

  fetchComments = () => {
    const { comments } = this.state;
    this.setState({ loading: true }, () => {
      const lastCommentTime = comments.length ? comments[comments.length - 1].createdAt : '';
      this.props
        .fetchComments(lastCommentTime)
        .then(({ data }) =>
          this.setState({
            comments: comments.concat(data),
            loading: false,
          }),
        )
        .catch(err =>
          // TODO: do something
          this.setState({
            comments: [],
            loading: false,
          }),
        );
    });
  };

  onCommentSubmit = () => {
    this.props.postComment(this.state.comment);
    this.setState({
      comment: '',
      newComments: [this.state.comment].concat(this.state.newComments),
    });
  };

  onCommentCancel = () => {
    this.setState({ comment: '' });
  };

  onCommentChange = ({ target: { value } }) => {
    this.setState({ comment: value });
  };

  render() {
    const { user } = this.props;
    const { comment, comments, loading, newComments } = this.state;

    const lastComment = comments.length ? comments[comments.length - 1] : null;

    return (
      <Fragment>
        <span className="ms-fontSize-l">תגובות:</span>
        <Section>
          <Flex>
            <Box width={50}>
              <CommentPersona
                size={PersonaSize.size40}
                imageUrl={`/profile/${user && user.id}/profile.png`}
              />
            </Box>
            <Box width="100%">
              <TextField
                placeholder="הזן את התגובה פה"
                multiline
                resizable={false}
                onChange={this.onCommentChange}
                value={comment}
              />
            </Box>
            <CommentButton
              text="הגב"
              type="submit"
              primary={true}
              onClick={this.onCommentSubmit}
              disabled={!comment.length}
            />
            <CommentButton text="בטל" onClick={this.onCommentCancel} />
          </Flex>
        </Section>
        <Section>
          {/* <Shimmer
            customElementsGroup={(
              <Box>
                {Array.apply(null, {length: 10}).map(Number.call, Number).map(i => (
                  <Box key={i} width={1}>
                    <Flex>
                      <ShimmerElementsGroup
                        shimmerElements={[
                          { type: ElemType.circle, height: 40 },
                          { type: ElemType.gap, width: 10, height: 40 }
                        ]}
                      />
                      <ShimmerElementsGroup
                        flexWrap
                        width={150}
                        shimmerElements={[
                          { type: ElemType.gap, width: '100%', height: 8 },
                          { type: ElemType.line, width: '100%', height: 5.5, verticalAlign: 'bottom' },
                          { type: ElemType.line, width: '100%', height: 5.5, verticalAlign: 'top' },
                          { type: ElemType.line, width: '60%', height: 8 },
                          { type: ElemType.gap, width: '40%', height: 8 },
                          { type: ElemType.gap, width: '100%', height: 8 },
                        ]}
                      />
                      <ShimmerElementsGroup
                        shimmerElements={[
                          { type: ElemType.gap, width: 20, height: 40 }
                        ]}
                      />
                      <ShimmerElementsGroup
                        flexWrap
                        width={'calc(100% - 200px'}
                        shimmerElements={[
                          { type: ElemType.line, width: '100%', height: 14 },
                          { type: ElemType.line, width: '70%', height: 14 },
                          { type: ElemType.gap, width: '30%', height: 20 },
                        ]}
                      />
                    </Flex>
                    <ShimmerElementsGroup
                      shimmerElements={[
                        { type: ElemType.gap, width: '100%', height: 15 }
                      ]}
                    />
                  </Box>
                ))}
              </Box>
            )}
            isDataLoaded={!loading}
          > */}
          {comments.length + newComments.length ? (
            <Fragment>
              {newComments.map(comment => (
                <VideoComment channel={user} createdAt={Date.now()} comment={comment} />
              ))}
              {comments.map(comment => (
                <VideoComment
                  channel={comment.channel}
                  createdAt={comment.createdAt}
                  comment={comment.comment}
                />
              ))}
            </Fragment>
          ) : (
            <NoComments loading={loading}>אין תגובות</NoComments>
          )}
          <Waypoint key={lastComment} onEnter={this.fetchComments} />
          {loading ? <Spinner size={SpinnerSize.large} label="טוען תגובות..." /> : null}
          {/* </Shimmer> */}
        </Section>
      </Fragment>
    );
  }
}

export default CommentSection;
