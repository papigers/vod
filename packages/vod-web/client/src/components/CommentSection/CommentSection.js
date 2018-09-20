import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { Flex, Box } from 'grid-styled';

import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Shimmer, ShimmerElementType as ElemType, ShimmerElementsGroup } from 'office-ui-fabric-react/lib/Shimmer';
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';

import Comment from 'components/VideoComment';

const NewCommentSection = styled.div`
  margin-top: -16px;
  padding: 20px 25px;
`;

const CommentsSection = styled.div`
  margin-top: -16px;
  padding: 20px 25px;
`;

const CommentsTitle = styled.h2`
  margin-top: -16px;
`;

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

class CommentSection extends Component {
  constructor() {
    super();
    this.state = {
      comment: "",
      comments: [],
      loading: true,
    };
  }

  componentDidMount() {
    this.fetchComments();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.commentableId !== this.props.commentableId) {
      this.setState({
        comments: [],
        loading: true,
      }, this.fetchComments);
    }
  }

  fetchComments() {
    this.props.fetchComments()
      .then(({ data }) =>
        this.setState({
          comments: data,
          loading: false,
        })
      )
      .catch((err) =>
        // TODO: do something
        this.setState({
          comments: [],
          loading: false,
        })
      );
  }

  onCommentSubmit = ()  =>  {
    this.props.postComment(this.state.comment);
    this.setState({ comment: '' });
  }

  onCommentCancel = ()  =>  {
    this.setState({ comment: '' });
  }

  onCommentChange = ({ target: { value } }) => {
    this.setState({ comment: value });
  }

  render() {
    const { user } = this.props;
    const { comment, comments, loading } = this.state;

    return (
      <Fragment>
        <CommentsTitle>תגובות:</CommentsTitle>
        <NewCommentSection>
          <Flex>
            <Box width={50}>
              <CommentPersona
                size={PersonaSize.size40}
                imageUrl={`/profile/${user.id}/profile.png`}
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
            <CommentButton
              text="בטל"
              onClick={this.onCommentCancel}
            />
          </Flex>
        </NewCommentSection>
        <CommentsSection>
          <Shimmer
          customElementsGroup={(
            <ShimmerElementsGroup
              shimmerElements={[
                { type: ElemType.circle, height: 40 },
                { type: ElemType.gap, width: '2%', height: 18 },
                { type: ElemType.line, width: '18%', height: 45 },
                { type: ElemType.gap, width: '5%', height: 18 },
                { type: ElemType.line, width: '75%', height: 45 },
              ]}
            />
          )} 
          isDataLoaded={!loading}>
            {comments.map((comment) => (
              <VideoComment
                channel={comment.channel}
                createdAt={comment.createdAt}
                comment={comment.comment}
              />
            ))}
          </Shimmer>
        </CommentsSection>
      </Fragment>
    );
  }
}

export default CommentSection;
