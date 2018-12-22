import React, { Component } from 'react';
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

const ContentContainer = FormContainer.extend`
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
    const { onSubmit, videos, onClose } = this.props;

    this.setState({
      loading: true,
      error: null,
    });
    onSubmit(videos).then(results => {
      const errors = results.filter(res => res.status === 'error');
      if (errors.length) {
        return this.setState({
          error: 'print err',
          loading: false,
        });
      }
      this.setState({
        loading: false,
      });
      onClose();
    });
  }

  render() {
    const { error, loading } = this.state;

    return (
      <FormContainer>
        <Form onSubmit={this.onSubmit}>
          <p>האם אתה בטוח שברצונך ללמחוק סרטונים אלו?</p>
          <p>לא יהיה ניתן לשחזר סרטונים אלו.</p>
          <ContentContainer>
            {loading ? <Spinner size={SpinnerSize.large} ariaLive="loading" /> : null}
          </ContentContainer>
          <ContentContainer>
            {loading ? null : (
              <FormButton
                primary
                disabled={loading}
                text="שמור"
                iconProps={{ iconName: 'Save' }}
                onClick={() => this.onSubmit()}
              />
            )}
            <FormButton
              disabled={loading}
              text="בטל"
              iconProps={{ iconName: 'Cancel' }}
              onClick={this.props.onClose}
            />
          </ContentContainer>
          <ContentContainer>{error && <ErrorMsg width={1}>{error}</ErrorMsg>}</ContentContainer>
        </Form>
      </FormContainer>
    );
  }
}

export default DeleteForm;
