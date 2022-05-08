import { Box, Button } from '@material-ui/core';
import { useCallback, useContext, useState } from 'react';

import AddIcon from '@material-ui/icons/Add';
import ConfirmDialog from '../../ConfirmDialog';
import DocumentList from '../../DocumentList';
import FileDescriptorDialog from './FileDescriptorDialog';
import { observer } from 'mobx-react-lite';
import RichTextEditorDialog from '../../RichTextEditor/RichTextEditorDialog';
import { StoreContext } from '../../../store';
import useTranslation from 'next-translate/useTranslation';

const TemplateList = () => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [editTemplate, setEditTemplate] = useState(false);
  const [editFileDescriptor, setEditFileDescriptor] = useState(false);
  const [templateToRemove, setTemplateToRemove] = useState(false);

  // TODO optimize the rendering here
  const templates = store.template.items.filter(({ linkedResourceIds = [] }) =>
    linkedResourceIds.includes(store.lease.selected?._id)
  );

  const onLoadTemplate = useCallback(async () => {
    if (!editTemplate || !editTemplate._id) {
      return '';
    }
    store.template.setSelected(
      store.template.items.find(({ _id }) => _id === editTemplate._id)
    );
    return store.template.selected.contents;
  }, [store.template, editTemplate]);

  const onSaveTemplate = useCallback(
    async (template) => {
      //setError('');
      if (!template._id) {
        const { status, data } = await store.template.create(template);
        if (status !== 200) {
          // switch (status) {
          //   case 422:
          //     return setError(
          //       t('')
          //     );
          //   case 404:
          //     return setError(t('Template does not exist'));
          //   case 403:
          //     return setError(t(''));
          //   default:
          //     return setError(t('Something went wrong'));
          // }
          return console.error(status);
        }
        if (data.type === 'text') {
          editTemplate._id = data._id;
        } else if (data.type === 'fileDescriptor') {
          editFileDescriptor._id = data._id;
        }
      } else {
        const { status } = await store.template.update(template);
        if (status !== 200) {
          // switch (status) {
          //   case 422:
          //     return setError(
          //       t('')
          //     );
          //   case 404:
          //     return setError(t('Template does not exist'));
          //   case 403:
          //     return setError(t(''));
          //   default:
          //     return setError(t('Something went wrong'));
          // }
          return console.error(status);
        }
      }
    },
    [editFileDescriptor, editTemplate, store.template]
  );

  const onSaveTextTemplate = useCallback(
    async (title, contents, html) => {
      await onSaveTemplate({
        _id: editTemplate?._id,
        name: title,
        type: 'text',
        contents,
        html,
        linkedResourceIds: store.lease.selected?._id
          ? [store.lease.selected._id]
          : [],
      });
    },
    [editTemplate?._id, onSaveTemplate, store.lease.selected._id]
  );

  const onSaveUploadTemplate = useCallback(
    async ({ name, description, hasExpiryDate }) => {
      await onSaveTemplate({
        _id: editFileDescriptor?._id,
        name,
        description,
        type: 'fileDescriptor',
        hasExpiryDate,
        linkedResourceIds: store.lease.selected?._id
          ? [store.lease.selected._id]
          : [],
      });
    },
    [editFileDescriptor?._id, onSaveTemplate, store.lease.selected._id]
  );

  const onDeleteTemplate = useCallback(async () => {
    if (!templateToRemove) {
      return;
    }

    if (templateToRemove.linkedResourceIds?.length <= 1) {
      await store.template.delete([templateToRemove._id]);
    } else {
      await store.template.update({
        ...templateToRemove,
        linkedResourceIds: store.lease.selected?._id
          ? [
              ...editTemplate.linkedResourceIds.filter(
                (_id) => store.lease.selected._id !== _id
              ),
            ]
          : templateToRemove.linkedResourceIds,
      });
    }
  }, [
    templateToRemove,
    store.lease.selected,
    store.template,
    editTemplate.linkedResourceIds,
  ]);

  const handleClickEdit = useCallback((template) => {
    if (template.type === 'text') {
      setEditTemplate(template);
    } else if (template.type === 'fileDescriptor') {
      setEditFileDescriptor(template);
    }
  }, []);

  const handleClickAddFileDescriptor = useCallback(() => {
    setEditFileDescriptor({});
  }, []);

  const handleClickAddText = useCallback(() => {
    setEditTemplate({});
  }, []);

  return (
    <>
      <Box display="flex" mb={1}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleClickAddFileDescriptor}
        >
          {t('Upload template')}
        </Button>
        <Box ml={1}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleClickAddText}
          >
            {t('Text template')}
          </Button>
        </Box>
      </Box>
      <DocumentList
        documents={templates}
        onEdit={handleClickEdit}
        onDelete={setTemplateToRemove}
      />
      <RichTextEditorDialog
        open={editTemplate}
        setOpen={setEditTemplate}
        onLoad={onLoadTemplate}
        onSave={onSaveTextTemplate}
        title={editTemplate.name}
        fields={store.template.fields}
      />
      <FileDescriptorDialog
        open={editFileDescriptor}
        setOpen={setEditFileDescriptor}
        onSave={onSaveUploadTemplate}
      />
      <ConfirmDialog
        title={t('Are you sure to remove this template document?')}
        subTitle={templateToRemove.name}
        open={templateToRemove}
        setOpen={setTemplateToRemove}
        onConfirm={onDeleteTemplate}
      />
    </>
  );
};

export default observer(TemplateList);