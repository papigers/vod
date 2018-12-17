import React, { Component } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

const Form = styled.div`
  align-content: center;
  width:30vw;
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
        debugger;
        const {
            onSubmit,
            videos,
            onClose
        } = this.props;

        Promise.resolve((video) => {
            
        }).then(() => {
            this.setState({
                loading: true,
                error: null,
            });
            return onSubmit(videos);
        }).then(() => {
            return onClose();
        }).catch((err) => {
             this.setState({
                error: err,
                loading: false,
            })
            return console.error(err);
        });
    }

    render() {
        const {
            error,
            loading
        } = this.state;

        return (
            <FormContainer>
                <Form onSubmit={this.onSubmit}>
                    <p>האם אתה בטוח שברצונך ללמחוק סרטונים אלו?</p>
                    <p>לא יהיה ניתן לשחזר סרטונים אלו.</p>
                    <ContentContainer>
                        <FormButton
                            primary
                            disabled={loading}
                            text='מחק'
                            iconProps={{ iconName: 'Delete' }}
                            onClick={() => this.onSubmit()}
                        />
                        <FormButton
                            disabled={loading}
                            text='בטל'
                            iconProps={{ iconName: 'Cancel' }}
                            onClick={this.props.onClose}
                        />
                    </ContentContainer>
                    {error && (
                        <ErrorMsg width={1}>
                            {error}
                        </ErrorMsg>
                    )}
                    {loading ? 
                        <Spinner size={SpinnerSize.large} label="טוען..." ariaLive="assertive" />
                        : null
                    }
                </Form>
            </FormContainer>
        );
    }
}

export default DeleteForm;