import React, { Component } from 'react';
import styled from 'styled-components';

import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';

const DropdownOption = styled.div`
  display: flex;
  flex-direction: column;
  align-items: end;
  justify-content: center;
  height: 100%;

  ${props => console.log(props)}

  .ms-Dropdown-item:hover &,
  .ms-Dropdown-item:hover & .ms-Persona-primaryText {
    color: ${({ theme }) => theme.palette.themePrimary};
  }

  i {
    margin-left: 8px;
  }
`;

const DropdownSubtext = styled.div`
  font-size: 80%;
  color: ${({ theme }) => theme.palette.bodyText} !important;
`;

class VideoStateDropdown extends Component {
  onRenderStateOption = (item, render, type) => {
    const option = item[0] || item;
    return (
      <DropdownOption>
        <div>
          {option.data && option.data.icon && (
            <Icon iconName={option.data.icon} aria-hidden="true" title={option.text} />
          )}
          <span>{option.text}</span>
        </div>
        {type !== 'title' ? <DropdownSubtext>{option.data.subText}</DropdownSubtext> : null}
      </DropdownOption>
    );
  };

  getStateKey(key) {
    switch (key) {
      case 'DRAFT':
        return {
          key,
          text: 'טיוטה',
          data: {
            icon: 'FullWidthEdit',
            subText: 'הסרטון לא מפורסם ונגיש לעריכה למנהלי הערוץ',
          },
        };
      case 'PUBLISHED':
        return {
          key,
          text: 'מפורסם',
          data: {
            icon: 'RedEye',
            subText: 'הסרטון יהיה מוצג כרגיל ויהיה נגיש לכל משתמש מורשה',
          },
        };
      case 'UNLISTED':
        return {
          key,
          text: 'קישור בלבד',
          data: {
            icon: 'Hide',
            subText: 'הסרטון יהיה מוסתר מהאתר אך יהיה נגיש לכל משתמש מורשה דרך קישור',
          },
        };
      default:
        return null;
    }
  }

  render() {
    const { ...props } = this.props;
    return (
      <Dropdown
        label="מצב פרסום"
        onRenderTitle={(...args) => this.onRenderStateOption(...args, 'title')}
        onRenderOption={this.onRenderStateOption}
        options={['PUBLISHED', 'UNLISTED', 'DRAFT'].map(this.getStateKey)}
        {...props}
      />
    );
  }
}

export default VideoStateDropdown;
