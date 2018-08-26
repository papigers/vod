import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import PeoplePicker from 'components/PeoplePicker';

const DropdownContainer = styled.div`
  max-width: 250px;
`;

class NewChannelForm extends Component{
    render(){

      const {
        step,
        progress,
        Channel: {
          name,
          description,
          privacy,
          thumbnails,
          selectedThumbnail
        },
        metadata,
        onChangeName,
        onChangeDescription,
        onChangePrivacy
      } = this.props;


        return(
            
          <Flex justifyContent="center">
            <TextField
              label="שם הערוץ"
              required
              value={name}
              onChanged={onChangeName}
            />
            <DropdownContainer>
              <Dropdown
                required
                label="גישה"
                selectedKey={privacy}
                onChanged={onChangePrivacy}
                onRenderTitle={this.onRenderPrivacyOption}
                onRenderOption={this.onRenderPrivacyOption}
                placeHolder="בחר/י גישה לסרטון"
                options={[
                  { key: 'public', text: 'ציבורי', data: { icon: 'Group' } },
                  { key: 'private', text: 'פרטי', data: { icon: 'Contact' } },
                ]}
              />
            </DropdownContainer>
            {privacy !== 'public' ? (
              <PeoplePicker label="הסרטון משותף עם:" />
            ) :  null}
            <TextField
              label="תיאור"
              multiline
              autoAdjustHeight
              value={description}
              onChanged={onChangeDescription}
            />
              <Label>בחר תמונת תצוגה:</Label>
          </Flex>
            
        );
    }
}