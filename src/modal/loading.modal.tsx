import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ModalHeader, ModalBody, ModalFooter } from '@carbon/react';
import { type Attachment } from '@openmrs/esm-framework';
import styles from './loading.modal.scss';
import imageLoader from '../assets/images/Sa7X.gif';

interface LoadModalProps {
  title: string;
  isAlert: boolean;
  close: () => void;
  onConfirmation: (attachment: Attachment) => void;
}

const LoadModal: React.FC<LoadModalProps> = ({
  close,
  title,
  isAlert,
  onConfirmation,
}) => {
  const { t } = useTranslation();

  return (
    <>

      <ModalBody>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          {!isAlert && <img src={imageLoader} alt="Loading Gif" style={{ width: '100px' }} />}
          <div style={{ fontSize: '30px'}}>{title}</div>
        </div>
        {isAlert && <ModalFooter>
        <Button size="lg" kind="secondary" onClick={() => close()}>
          {t('ok', 'Ok')}
        </Button>
        </ModalFooter>}
      </ModalBody>

    </>
  );
};

export default LoadModal;
