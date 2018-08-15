import {
  SET_UPLOAD_PROGRESS,
  SET_UPLOAD_FILE,
  SET_UPLOAD_METADATA,
  SET_UPLOAD_STEP,
  SET_UPLOAD_VIDEO_SRC,
  SET_UPLOAD_VIDEO_THUMBNAILS,
  SELECT_UPLOAD_VIDEO_THUMBNAIL,
  SET_UPLOAD_VIDEO_NAME,
  SET_UPLOAD_VIDEO_DESCRIPTION,
  SET_UPLOAD_VIDEO_PRIVACY,
  SET_UPLOAD_VIDEO_ACL,
} from 'constants/actionTypes';

export function setUploadProgress(progress) {
  return {
    type: SET_UPLOAD_PROGRESS,
    progress,
  };
}

export function setUploadFile(file) {
  return {
    type: SET_UPLOAD_FILE,
    file,
  };
}

export function setUploadMetadata(metadata) {
  return {
    type: SET_UPLOAD_METADATA,
    metadata,
  };
}

export function setUploadStep(step) {
  return {
    type: SET_UPLOAD_STEP,
    step,
  };
}

export function setUploadVideoSrc(src) {
  return {
    type: SET_UPLOAD_VIDEO_SRC,
    src,
  };
}

export function setUploadVideoThumbnails(thumbnails) {
  return {
    type: SET_UPLOAD_VIDEO_THUMBNAILS,
    thumbnails,
  };
}

export function selectUploadVideoThumbnail(thumbnail) {
  return {
    type: SELECT_UPLOAD_VIDEO_THUMBNAIL,
    thumbnail,
  };
}

export function setUploadVideoName(name) {
  return {
    type: SET_UPLOAD_VIDEO_NAME,
    name,
  };
}

export function setUploadVideoDescription(description) {
  return {
    type: SET_UPLOAD_VIDEO_DESCRIPTION,
    description,
  };
}

export function setUploadVideoPrivacy(privacy) {
  return {
    type: SET_UPLOAD_VIDEO_PRIVACY,
    privacy,
  };
}

export function setUploadVideoACL(acl) {
  return {
    type: SET_UPLOAD_VIDEO_ACL,
    acl,
  };
}
