"use client";

import { useState, type ReactNode } from "react";
import { Download, FolderPlus, Grid3x3, List, Share2, Trash2 } from "lucide-react";

import { useTheme, type Theme } from "@shared/lib";
import {
  Avatar,
  Button,
  Checkbox,
  ConfirmDialog,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  IconButton,
  Input,
  Modal,
  ModalClose,
  ModalContent,
  ModalTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  SegmentedControl,
  Separator,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ToastClose,
  ToastDescription,
  ToastRoot,
  ToastTitle,
  Tooltip,
} from "@shared/ui";

import styles from "./ui-kit-view.module.scss";

const THEME_OPTIONS = [
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
  { value: "system", label: "Системная" },
];

const VIEW_OPTIONS = [
  { value: "list", label: "Список", icon: <List size={16} aria-hidden="true" /> },
  { value: "grid", label: "Сетка", icon: <Grid3x3 size={16} aria-hidden="true" /> },
];

type SectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

const Section = ({ title, description, children }: SectionProps) => (
  <section className={styles.section}>
    <header className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {description ? <p className={styles.sectionDescription}>{description}</p> : null}
    </header>
    {children}
  </section>
);

/** Ручной smoke-тест клавиатуры и фокуса: все компоненты `shared/ui` в обеих темах. */
export const UiKitView = () => {
  const { theme, setTheme } = useTheme();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>UI Kit</h1>
          <p className={styles.subtitle}>
            Radix Primitives + SCSS Modules: токены, темы и компоненты shared/ui.
          </p>
        </div>
        <SegmentedControl
          aria-label="Тема оформления"
          options={THEME_OPTIONS}
          value={theme}
          onValueChange={(value) => setTheme(value as Theme)}
        />
      </header>

      <Section title="Кнопки" description="Варианты, размеры, иконки и состояние загрузки.">
        <div className={styles.row}>
          <Button>Основная</Button>
          <Button variant="secondary">Вторичная</Button>
          <Button variant="ghost">Прозрачная</Button>
          <Button variant="danger" iconLeft={<Trash2 size={16} aria-hidden="true" />}>
            Удалить
          </Button>
        </div>
        <div className={styles.row}>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button loading>Загрузка</Button>
        </div>
        <div className={styles.row}>
          <Tooltip content="Скачать файл">
            <IconButton label="Скачать">
              <Download size={18} aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip content="Поделиться ссылкой">
            <IconButton label="Поделиться" variant="subtle">
              <Share2 size={18} aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <IconButton label="Удалить" tone="danger">
            <Trash2 size={18} aria-hidden="true" />
          </IconButton>
        </div>
      </Section>

      <Section
        title="Формы"
        description="Field связывает метку, подсказку и ошибку с контролом через id и aria-describedby."
      >
        <div className={styles.grid}>
          <div className={styles.column}>
            <Field label="Название папки" hint="До 64 символов" required>
              <Input placeholder="Например, Отчёты" />
            </Field>
            <Field label="Поиск" error="Минимум 3 символа">
              <Input defaultValue="от" invalid />
            </Field>
          </div>
          <div className={styles.column}>
            <Field label="Описание">
              <Textarea placeholder="Комментарий к папке" />
            </Field>
            <Checkbox label="Показывать скрытые файлы" defaultChecked />
            <Checkbox label="Выбрать всё" checked="indeterminate" />
          </div>
        </div>
      </Section>

      <Section
        title="Навигация"
        description="Tabs и SegmentedControl: переключение стрелками и видимый фокус."
      >
        <Tabs defaultValue="all">
          <TabsList aria-label="Фильтр по типу">
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="files">Файлы</TabsTrigger>
            <TabsTrigger value="folders">Папки</TabsTrigger>
          </TabsList>
          <TabsContent value="all">Все элементы текущей папки.</TabsContent>
          <TabsContent value="files">Только файлы.</TabsContent>
          <TabsContent value="folders">Только папки.</TabsContent>
        </Tabs>
        <div className={styles.row}>
          <SegmentedControl
            aria-label="Режим отображения"
            options={VIEW_OPTIONS}
            defaultValue="list"
          />
        </div>
      </Section>

      <Section
        title="Оверлеи"
        description="Модалка, подтверждение, меню, контекстное меню, поповер и подсказка."
      >
        <div className={styles.row}>
          <Modal>
            <ModalTrigger asChild>
              <Button variant="secondary">Открыть модалку</Button>
            </ModalTrigger>
            <ModalContent
              title="Новая папка"
              description="Папка появится в текущем каталоге."
              footer={
                <>
                  <ModalClose asChild>
                    <Button variant="secondary">Отмена</Button>
                  </ModalClose>
                  <Button iconLeft={<FolderPlus size={16} aria-hidden="true" />}>Создать</Button>
                </>
              }
            >
              <Field label="Название">
                <Input placeholder="Например, Отчёты" />
              </Field>
            </ModalContent>
          </Modal>

          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Удалить файл
          </Button>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Удалить файл?"
            description="Файл переместится в корзину, его можно будет восстановить."
            confirmLabel="Удалить"
            tone="danger"
            onConfirm={() => {
              setConfirmOpen(false);
              setToastOpen(true);
            }}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">Действия</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Файл</DropdownMenuLabel>
              <DropdownMenuItem>Переименовать</DropdownMenuItem>
              <DropdownMenuItem>Скачать</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem tone="danger">Удалить</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary">Фильтры</Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className={styles.stack}>
                <Checkbox label="Только изображения" defaultChecked />
                <Checkbox label="Только документы" />
              </div>
            </PopoverContent>
          </Popover>

          <Tooltip content="Откроется в новой вкладке">
            <Button variant="ghost">Подсказка</Button>
          </Tooltip>
        </div>

        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className={styles.contextArea}>Правый клик по этой области</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Открыть</ContextMenuItem>
            <ContextMenuItem>Скачать</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem tone="danger">Удалить</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Section>

      <Section
        title="Обратная связь"
        description="Прогресс, тосты, скелетоны, аватары и разделители."
      >
        <div className={styles.grid}>
          <div className={styles.stack}>
            <p className={styles.muted}>Загрузка файла — 65%</p>
            <Progress value={65} aria-label="Загрузка файла" />
            <Separator decorative={false} />
            <div className={styles.avatarRow}>
              <Avatar alt="Демо-пользователь" fallback="ДП" />
              <Avatar alt="Иван Петров" fallback="ИП" size="lg" />
            </div>
          </div>
          <div className={styles.stack}>
            <Skeleton height={16} />
            <Skeleton width="60%" height={16} />
            <Skeleton circle width={44} height={44} />
          </div>
          <div className={styles.stack}>
            <Button variant="secondary" onClick={() => setToastOpen(true)}>
              Показать тост
            </Button>
            <ToastRoot open={toastOpen} onOpenChange={setToastOpen} tone="success">
              <ToastTitle>Файл загружен</ToastTitle>
              <ToastDescription>report.pdf готов к скачиванию</ToastDescription>
              <ToastClose />
            </ToastRoot>
          </div>
        </div>
      </Section>
    </div>
  );
};
