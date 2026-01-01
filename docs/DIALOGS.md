# Custom Dialog Components

This project includes two beautiful Airbnb-inspired dialog components to replace browser's native `alert()` and `confirm()` dialogs.

## 📦 Components

### 1. ConfirmationDialog
For actions that require user confirmation (delete, update, etc.)

### 2. AlertDialogCustom
For displaying important messages and notifications

## 🎨 Design Features

- **Airbnb-styled**: Rounded corners, beautiful shadows, and smooth animations
- **Variant Support**: Different colors and icons for different contexts
- **RTL Support**: Fully compatible with Arabic text direction
- **Accessibility**: Built on Radix UI primitives
- **Responsive**: Works perfectly on mobile and desktop

## 🚀 Usage Examples

### ConfirmationDialog

```tsx
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useState } from 'react';

function MyComponent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const handleDelete = () => {
    setDialogOpen(true);
  };
  
  const confirmDelete = () => {
    // Perform delete action
    console.log('Item deleted');
    setDialogOpen(false);
  };

  return (
    <>
      <Button onClick={handleDelete}>حذف</Button>
      
      <ConfirmationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="هل أنت متأكد؟"
        description="هذا الإجراء لا يمكن التراجع عنه."
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={confirmDelete}
        variant="destructive"
        loading={false}
      />
    </>
  );
}
```

### AlertDialogCustom

```tsx
import { AlertDialogCustom } from '@/components/ui/alert-dialog-custom';
import { useState } from 'react';

function MyComponent() {
  const [alertOpen, setAlertOpen] = useState(false);
  
  const showSuccess = () => {
    setAlertOpen(true);
  };

  return (
    <>
      <Button onClick={showSuccess}>عرض رسالة</Button>
      
      <AlertDialogCustom
        open={alertOpen}
        onOpenChange={setAlertOpen}
        title="تم بنجاح!"
        description="تمت العملية بنجاح."
        buttonText="حسناً"
        variant="success"
      />
    </>
  );
}
```

## 🎭 Variants

Both components support multiple variants:

| Variant | Use Case | Icon | Color |
|---------|----------|------|-------|
| `default` | General confirmations | Info | Blue |
| `destructive` | Delete/Remove actions | Warning Triangle | Red |
| `warning` | Caution messages | Warning Triangle | Amber |
| `success` | Success messages | Check Circle | Green |
| `info` | Informational | Info Circle | Blue |
| `error` | Error messages | X Circle | Red |

## 🔧 Props

### ConfirmationDialog

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | boolean | - | Controls dialog visibility |
| `onOpenChange` | (open: boolean) => void | - | Callback when visibility changes |
| `title` | string | - | Dialog title |
| `description` | string | - | Dialog description (optional) |
| `confirmText` | string | "تأكيد" | Confirm button text |
| `cancelText` | string | "إلغاء" | Cancel button text |
| `onConfirm` | () => void | - | Called when user confirms |
| `onCancel` | () => void | - | Called when user cancels (optional) |
| `variant` | ConfirmationVariant | "default" | Visual variant |
| `loading` | boolean | false | Shows loading state |

### AlertDialogCustom

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | boolean | - | Controls dialog visibility |
| `onOpenChange` | (open: boolean) => void | - | Callback when visibility changes |
| `title` | string | - | Dialog title |
| `description` | string | - | Dialog description (optional) |
| `buttonText` | string | "حسناً" | Button text |
| `variant` | AlertVariant | "default" | Visual variant |

## 🪝 Hooks (Optional)

For even easier usage, both components include custom hooks:

### useConfirmationDialog

```tsx
import { useConfirmationDialog, ConfirmationDialog } from '@/components/ui/confirmation-dialog';

function MyComponent() {
  const { dialogState, openDialog, closeDialog } = useConfirmationDialog();
  
  const handleDelete = () => {
    openDialog({
      title: "حذف العنصر",
      description: "هل أنت متأكد؟",
      variant: "destructive",
      onConfirm: () => {
        console.log('Deleted!');
        closeDialog();
      }
    });
  };

  return (
    <>
      <Button onClick={handleDelete}>حذف</Button>
      
      <ConfirmationDialog
        {...dialogState}
        onOpenChange={closeDialog}
      />
    </>
  );
}
```

### useAlertDialog

```tsx
import { useAlertDialog, AlertDialogCustom } from '@/components/ui/alert-dialog-custom';

function MyComponent() {
  const { alertState, showAlert, closeAlert } = useAlertDialog();
  
  const handleSuccess = () => {
    showAlert({
      title: "نجح!",
      description: "تمت العملية بنجاح",
      variant: "success"
    });
  };

  return (
    <>
      <Button onClick={handleSuccess}>حفظ</Button>
      
      <AlertDialogCustom
        {...alertState}
        onOpenChange={closeAlert}
      />
    </>
  );
}
```

## 📍 Where Used

These dialogs are currently implemented in:

1. **My Properties Page** (`app/my-properties/page.tsx`)
   - Delete property confirmation

2. **Property Detail Page** (`app/properties/[id]/page.tsx`)
   - Delete image confirmation

## 🎯 Best Practices

1. **Always provide context**: Include a clear description explaining what will happen
2. **Use appropriate variants**: Match the variant to the action (destructive for delete, success for completion)
3. **Handle loading states**: Show loading state during async operations
4. **Clear focus**: Only one dialog should be open at a time
5. **Proper cleanup**: Always close dialogs after actions complete

## 🌐 Internationalization

All dialog text supports Arabic and can be easily localized using the i18n system:

```tsx
<ConfirmationDialog
  title={t('property.deleteConfirm')}
  confirmText={t('common.delete')}
  cancelText={t('common.cancel')}
  // ...
/>
```

## 🎨 Customization

To customize the dialog styling, edit:
- `components/ui/dialog.tsx` - Base dialog component
- `components/ui/confirmation-dialog.tsx` - Confirmation dialog
- `components/ui/alert-dialog-custom.tsx` - Alert dialog
- `app/globals.css` - Color palette and animations

