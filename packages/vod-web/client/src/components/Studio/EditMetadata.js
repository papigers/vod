import React, { Component } from 'react';
import styled from 'styled-components';
import { Flex } from 'grid-styled';

import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { DefaultButton} from 'office-ui-fabric-react/lib/Button';

import TagPicker from 'components/TagPicker';

const Form = styled.form`
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

class EditForm extends Component {
    constructor() {
        super();
        this.state = {
            text: '',
            action: '',
            options: [],
            tags: [],
        };
      }

    componentDidMount() {
        this.initOptions();
    }

    componentDidUpdate(prevProps) {
        if (this.props.videos.length !== prevProps.videos.length) {
            this.initOptions();
        }
    }

    initOptions(){
        const { editType } = this.props;
        const options = [];
            switch (editType) {
                case 'name':
                    options.push(
                        { key: 'beginning', text: 'הכנס בהתחלה' },
                        { key: 'end', text: 'הכנס בסוף' },
                        { key: 'replace', text: 'החלף הכל' },
                    );
                    break;
                case 'tags':
                    options.push(
                        { key: 'add', text: 'הוסף תגיות' },
                        { key: 'remove', text: 'הסר תגיות' },
                        { key: 'replace', text: 'החלף הכל' },
                        { key: 'clean', text: 'מחק הכל' },
                    );
                    break;
                default:
                    options.push(
                        { key: 'beginning', text: 'הכנס בהתחלה' },
                        { key: 'end', text: 'הכנס בסוף' },
                        { key: 'replace', text: 'החלף הכל' },
                        { key: 'clean', text: 'נקה הכל' },
                    );
                    break;
            }
            this.setState ({
                options : options,
                action: options[0].key
            });
    }

    onTextChannge = ({target}) => {
        this.setState({
            text: target.value,
        });
    }

    onChangeTags = (tags) => {
        this.setState({
            tags: tags,
        });
    }

    onSelectionChannge = (e, index) => {
        this.setState({
            action: index.key,
        });
    }

    renderInput = () => {
        const {action, text} = this.state;
        const {editType} = this.props;
        if (editType === 'tags') {
            return <TagPicker
                label="תגיות:"
                onChange={this.onChangeTags}
                />
        }
        if (action !== 'clean') {
            return <TextField
                required
                label="טקסט"
                value={text}
                onChange={this.onTextChannge}
                multiline
                rows={4}
                />
        }
    }

    onSubmit = () => {
        debugger;
        const { text, action, tags} = this.state;
        const { editType, videos, onMetadataEdit, onTagsEdit, onClose} = this.props;
        if (editType === 'tags') {
            onTagsEdit(videos, action, tags).then(onClose);
        }
        else {
            videos.forEach(video => {
                switch (action) {
                    case 'beginning':
                        video[editType] = text.trimStart().concat(video[editType]);
                        break;
                    case 'end':
                        video[editType] = video[editType].concat(text.trim());
                        break;
                    case 'replace':
                        video[editType] = text.trim();
                        break;
                    case 'clean':
                        video[editType] = '';
                        break;
                }
                console.log(video[editType]);
            });

            onMetadataEdit(videos, editType).then(onClose);
        }
        
    }

    render() {
        const {options, action} = this.state;
        const {onClose} = this.props;
        return (
            <FormContainer>
                <Form>
                    <Dropdown
                        required
                        label="סוג עריכה"
                        selectedKey={action}
                        onChange={this.onSelectionChannge}
                        options={options}
                    />
                    {this.renderInput()}
                    <ContentContainer>
                        <FormButton
                            primary
                            text='שמור'
                            iconProps={{ iconName: 'Save' }}
                            onClick={() => this.onSubmit()}
                        />
                        
                        <FormButton
                            text='בטל'
                            iconProps={{ iconName: 'Delete' }}
                            onClick={onClose}
                        />
                    </ContentContainer>
                </Form>
            </FormContainer>
        );
    }
}

export default EditForm;