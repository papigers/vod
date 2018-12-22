import React, { Component } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { DefaultButton} from 'office-ui-fabric-react/lib/Button';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import TagPicker from 'components/TagPicker';
import VideoStateDropdown from 'components/VideoStateDropdown';

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

const ErrorMsg = styled(Box)`
  color: #e90000;
  text-align: center;
  font-weight: 600;
  font-size: 1.1em;
`;

class EditProperty extends Component {
    constructor() {
        super();
        this.state = {
            text: '',
            action: '',
            options: [],
            tags: [],
            state: null,
            error: null,
            loading: false,
        };
      }

    componentDidMount() {
        this.initOptions();
    }

    componentDidUpdate(prevProps) {
        if (this.props.editType !== prevProps.editType) {
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
            case 'state':
                options.push({ key: 'replace', text: 'שנה מצב פירסום' });
                break;
            case 'description':
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
    
    onChangeState = (e, { key }) =>
        this.setState({
            state: key,
        });

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
        const {action, text, loading, state} = this.state;
        const {editType} = this.props;
        if (editType === 'tags') {
            return <TagPicker
                label="תגיות:"
                disabled={loading}
                onChange={this.onChangeTags}
                />
        }
        else if (editType === 'state') {
            return (
                <VideoStateDropdown
                    required
                    label="מצב פרסום"
                    disabled={loading}
                    selectedKey={state}
                    onChange={this.onChangeState}
                    placeHolder="בחר/י באיזו צורה הסרטונים יוצגו"
                />
            );
        }
        if (action !== 'clean') {
            return <TextField
                required
                label="טקסט"
                disabled={loading}
                value={text}
                onChange={this.onTextChannge}
                multiline
                rows={4}
                />
        }
    }

    onSubmit = () => {
        const { text, action, state, tags} = this.state;
        const {
            editType,
            videos,
            onPropertyEdit,
            onTagsEdit,
            onClose,
        } = this.props;

        this.setState({
            loading: true,
        })

        if (editType === 'tags') {
            onTagsEdit(videos.map(video => video.id ), action, tags)
            .then(onClose)
            .catch(e =>{
                this.setState({
                    error: e.message,
                    loading: false,
                })
            });
        }
        else {
            const items = videos.map(video => {
                var item = video[editType];
                switch (action) {
                    case 'beginning':
                        item = text.trimStart().concat(video[editType]);
                        break;
                    case 'end':
                        item = video[editType].concat(text.trim());
                        break;
                    case 'replace':
                        if (editType === 'state') {
                            if (!state) {
                                this.setState({
                                    error: 'חייב לבחור מצב פרסום',
                                    loading: false,
                                });
                            }
                            item = state;
                        }
                        else {
                            item = text.trim();
                        }
                        break;
                    case 'clean':
                        item = '';
                        break;
                    default:
                        break;
                }
                return {id: video.id, property: item};
            });

            onPropertyEdit(items, editType)
            .then(onClose)
            .catch(e => {
                this.setState({
                    error: e.message,
                    loading: false,
                })
            });
        }
    }

    render() {
        const {options, action, error, loading} = this.state;
        const {onClose} = this.props;
        return (
            <FormContainer>
                <Form>
                    {options.length > 1 ? (
                        <Dropdown
                            required
                            label="סוג עריכה"
                            disabled={loading}
                            selectedKey={action}
                            onChange={this.onSelectionChannge}
                            options={options}
                        />
                    ) : <h3>{!!options.length && options[0].text}</h3>}
                    {this.renderInput()}
                    <ContentContainer>
                        {loading ? 
                            <Spinner size={SpinnerSize.large} ariaLive="loading" />
                        : null}
                    </ContentContainer>
                    <ContentContainer>
                        {loading ? 
                            null
                            : 
                            <FormButton
                                text="שמור"
                                primary
                                disabled={loading}
                                iconProps={{ iconName: 'Save' }}
                                onClick={() => this.onSubmit()}
                            />
                        }
                        <FormButton
                            text="בטל"
                            disabled={loading}
                            iconProps={{ iconName: 'Cancel' }}
                            onClick={onClose}
                        />
                    </ContentContainer>
                    <ContentContainer>
                        {error && (
                            <ErrorMsg width={1}>
                                {error}
                            </ErrorMsg>
                        )}
                    </ContentContainer>
                </Form>
            </FormContainer>
        );
    }
}

export default EditProperty;
