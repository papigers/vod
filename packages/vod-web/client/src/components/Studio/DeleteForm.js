import React, { Component } from 'react';
import styled from 'styled-components';
import { Flex } from 'grid-styled';

import { DefaultButton } from 'office-ui-fabric-react/lib/Button';

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

class DeleteForm extends Component {
    render() {
        const {onClose, onSubmit, videos} = this.props;

        return (
            <FormContainer>
                <Form>
                    <p>האם אתה בטוח שברצונך ללמחוק סרטונים אלו?</p>
                    <p>לא יהיה ניתן לשחזר סרטונים אלו.</p>
                    <ContentContainer>
                        <FormButton
                            primary
                            text='מחק'
                            iconProps={{ iconName: 'Delete' }}
                            onClick={() => onSubmit(videos)}
                        />
                        <FormButton
                            text='בטל'
                            onClick={onClose}
                        />
                    </ContentContainer>
                </Form>
            </FormContainer>
        );
    }
}

export default DeleteForm;