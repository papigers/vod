import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

const Form = styled.div`
  align-content: center;
  width: 30vw;
`;

const FormContainer = styled(Flex)`
  justify-content: center;
`;

const ContentContainer = styled(FormContainer)`
  margin: 1em 0;
`;

const FormButton = styled(DefaultButton)`
  margin: 0 1em;
`;

const ErrorMsg = styled(Box)`
  color: #e90000;
  text-align: center;
  font-weight: 600;
  font-size: 1.1em;
`;

class DeleteForm extends Component {
  constructor() {
    super();
    this.state = {
      error: null,
      loading: false,
    };
  }

  onSubmit() {
    const { onSubmit, playlist, onClose } = this.props;

    this.setState({
      loading: true,
      error: null,
    });
    onSubmit(playlist.id)
    .then(onClose)
    .catch(err => {
      this.setState({
        error: err,
        loading: false,
      });
    });
  }

  render() {
    const { error, loading } = this.state;

    return (
      <FormContainer>
        <Form onSubmit={this.onSubmit}>
          <p>האם אתה בטוח שברצונך למחוק פלייליסט זה?</p>
          <p>לא יהיה ניתן לשחזר פריטים שנמחקו.</p>
          <ContentContainer>
            {loading ? (
              <Spinner size={SpinnerSize.large} ariaLive="loading" />
            ) : (
              <Fragment>
                <FormButton
                  text="שמור"
                  primary
                  disabled={loading}
                  iconProps={{ iconName: 'Save' }}
                  onClick={() => this.onSubmit()}
                />
                <FormButton
                  text="בטל"
                  disabled={loading}
                  iconProps={{ iconName: 'Cancel' }}
                  onClick={this.props.onClose}
                />
              </Fragment>
            )}
          </ContentContainer>
          <ContentContainer>{error && <ErrorMsg width={1}>{error}</ErrorMsg>}</ContentContainer>
        </Form>
      </FormContainer>
    );
  }
}

export default DeleteForm;