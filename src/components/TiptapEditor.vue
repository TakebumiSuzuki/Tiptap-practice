<script setup lang="ts">
  import { ref, watch, onBeforeUnmount } from 'vue';
  import { useEditor, EditorContent } from '@tiptap/vue-3';
  import { BubbleMenu, FloatingMenu } from '@tiptap/vue-3/menus';
  import StarterKit from '@tiptap/starter-kit';
  import Highlight from '@tiptap/extension-highlight';
  import Placeholder from '@tiptap/extension-placeholder';
  import { CharacterCount } from '@tiptap/extension-character-count';
  import { type JSONContent } from '@tiptap/core';

  const props = defineProps<{ modelValue: JSONContent, maxLimit: number }>();
  const emit = defineEmits<{ (e: 'update:modelValue', value: JSONContent): void }>();

  const linkDialog = ref(false);
  const linkUrl = ref('');

  const editor = useEditor({
    // Vue のプロキシを除去して生オブジェクトにし、null/undefined なら空文字にフォールバック
    // content: props.modelValue ? JSON.parse(JSON.stringify(props.modelValue)) : '',
    content: props.modelValue,

    extensions: [
      // StarterKit には heading, bulletList, orderedList, blockquote, link などが含まれている
      StarterKit.configure({
        link: {
          openOnClick: true,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: { class: 'custom-link' },
        },
      }),

      Highlight.configure({
        multicolor: false,
        HTMLAttributes: {
          class: 'custom-highlight',
        },
      }),
      Placeholder.configure({
        placeholder: 'Select text to format it with various styles...',
        emptyEditorClass: 'is-editor-empty',
      }),
      CharacterCount.configure({
        limit: 1000,
      }),
    ],
    onUpdate: ({ editor }) => {
      const contentObj = editor.getJSON();
      emit('update:modelValue', contentObj);
    },
  });

  // 現在文字数を Reactive で管理
  const currentCount = ref(0);

  watch(
    () => editor.value?.storage.characterCount.characters() ?? 0,
    (count) => {
      currentCount.value = count;
    },
  );

  // 親側でデータがプログラム的に変更された場合の監視
  watch(
    () => props.modelValue,
    (newValue) => {
      if (!editor.value) return;

      // この比較ロジックは、Vueの v-model の仕組みにおける 無限ループを防ぐ ために必須
      const currentContent = JSON.stringify(editor.value.getJSON());
      const newContent = JSON.stringify(newValue);

      if (currentContent !== newContent) {
        if (newValue) {
          editor.value.commands.setContent(newValue);
        } else {
          editor.value.commands.clearContent();
        }
      }
    },
    { deep: true },
  );

  // --- リンク関連のロジック ---
  const openLinkDialog = () => {
    if (editor.value) {
      // 現在カーソルがある位置（または選択範囲の先頭）で、有効になっているリンクの情報を取得している
      const previousUrl = editor.value.getAttributes('link').href;
      // 既にリンクが貼ってあるテキストを選択していた場合ということ
      linkUrl.value = previousUrl || '';
    }
    linkDialog.value = true;
  };

  const closeLinkDialog = () => {
    linkDialog.value = false;
    linkUrl.value = '';
  };

  const setLink = () => {
    if (!linkUrl.value || !editor.value) {
      closeLinkDialog();
      return;
    }

    let url = linkUrl.value.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    // chain()は、これから複数の命令を連続してセットするぞという宣言
    // focus()は、エディタにカーソル（フォーカス）を戻す命令
    // extendMarkRange は、カーソルがリンク文字の途中にあった場合、自動的にそのリンク全体の文字列を選択状態まで広げるための命令
    // .run() は、セットした命令をすべて実行せよという合図
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    closeLinkDialog();
  };

  // --- Floating Menu のロジック ---
  /**
   * Floating Menu の表示条件:
   * カーソルがある行が「空の paragraph」であること
   */
  const floatingMenuShouldShow = ({ editor: e }: { editor: any }) => {
    if (!e.isActive('paragraph')) return false;

    const { $from } = e.state.selection;

    // 親 paragraph が空かどうかを判定
    return $from.parent.type.name === 'paragraph' && $from.parent.content.size === 0;
  };

  const handleHeadingToggle = (level: 2 | 3) => {
    if (!editor.value) return;
    if (editor.value.isActive('heading', { level })) {
      // 既に同じレベルの見出し → paragraph に戻す
      editor.value.chain().focus().setParagraph().run();
    } else {
      editor.value.chain().focus().setHeading({ level }).run();
    }
  };

  const handleImageInsert = () => {
    // TODO: 後で実装する。現時点では何もしない。
    console.log('[画像挿入] 未実装');
  };

  // メモリリーク防止のための後処理
  onBeforeUnmount(() => {
    editor.value?.destroy();
  });
</script>

<template>
  <v-card class="tiptap-editor-card" elevation="0">
    <v-card-text class="pa-0">
      <div v-if="editor" class="editor-wrapper">
        <editor-content :editor="editor" class="editor-content" />
        <p class="text-right mr-2 mt-1">{{ currentCount }} / {{ maxLimit }}</p>

        <!--
          カーソルが動くたびに、Tiptap側が floatingMenuShouldShow を実行して boolean を得る。
          つまり、FloatingMenuに、floatingMenuShouldShow という判定関数を渡している。
          そして、FloatingMenu は、editor, view, stateというキーバリューを持ったオブジェクトを引数として渡す。
        -->
        <FloatingMenu
          :editor="editor"
          :should-show="floatingMenuShouldShow"
          :options="{ placement: 'bottom', offset: { mainAxis: 4, crossAxis: 20 } }"
        >
          <div class="floating-menu-modern">
            <!-- Small Text -->
            <button
              class="floating-menu-btn floating-menu-btn-text"
              :class="{ 'is-active': editor.isActive('paragraph') && !editor.isActive('heading') }"
              title="Small Text"
              @click="editor.chain().focus().setParagraph().run()"
            >
              sm
            </button>

            <!-- Medium Text -->
            <button
              class="floating-menu-btn floating-menu-btn-text"
              :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
              title="Medium Text"
              @click="handleHeadingToggle(3)"
            >
              md
            </button>

            <!-- Large Text -->
            <button
              class="floating-menu-btn floating-menu-btn-text"
              :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
              title="Large Text"
              @click="handleHeadingToggle(2)"
            >
              lg
            </button>

            <div class="floating-menu-divider"></div>

            <!-- Blockquote -->
            <button
              class="floating-menu-btn"
              :class="{ 'is-active': editor.isActive('blockquote') }"
              title="Quote"
              @click="editor.chain().focus().toggleBlockquote().run()"
            >
              <v-icon size="18">mdi-format-quote-close</v-icon>
            </button>

            <div class="floating-menu-divider"></div>

            <!-- BulletList -->
            <button
              class="floating-menu-btn"
              :class="{ 'is-active': editor.isActive('bulletList') }"
              title="Bullet List"
              @click="editor.chain().focus().toggleBulletList().run()"
            >
              <v-icon size="18">mdi-view-list</v-icon>
            </button>

            <!-- OrderedList -->
            <button
              class="floating-menu-btn"
              :class="{ 'is-active': editor.isActive('orderedList') }"
              title="Ordered List"
              @click="editor.chain().focus().toggleOrderedList().run()"
            >
              <v-icon size="18">mdi-format-list-numbered</v-icon>
            </button>

            <div class="floating-menu-divider"></div>

            <!-- Insert Image -->
            <button class="floating-menu-btn" title="Insert Image" @click="handleImageInsert">
              <v-icon size="18">mdi-image-plus</v-icon>
            </button>
          </div>
        </FloatingMenu>

        <BubbleMenu :editor="editor" :options="{ placement: 'top', offset: 8 }">
          <div class="bubble-menu-modern">
            <!-- Bold -->
            <button
              class="menu-btn"
              :class="{ 'is-active': editor.isActive('bold') }"
              title="Bold"
              @click="editor.chain().focus().toggleBold().run()"
            >
              <v-icon size="18">mdi-format-bold</v-icon>
            </button>

            <!-- Strike -->
            <button
              class="menu-btn"
              :class="{ 'is-active': editor.isActive('strike') }"
              title="Strike"
              @click="editor.chain().focus().toggleStrike().run()"
            >
              <v-icon size="18">mdi-format-strikethrough</v-icon>
            </button>

            <!-- Highlight -->
            <button
              class="menu-btn"
              :class="{ 'is-active': editor.isActive('highlight') }"
              title="Highlight"
              @click="editor.chain().focus().toggleHighlight().run()"
            >
              <v-icon size="18">mdi-marker</v-icon>
            </button>

            <div class="menu-divider"></div>

            <!-- Link -->
            <button
              class="menu-btn"
              :class="{ 'is-active': editor.isActive('link') }"
              title="Link"
              @click="openLinkDialog"
            >
              <v-icon size="18">mdi-link-variant</v-icon>
            </button>
          </div>
        </BubbleMenu>
      </div>
    </v-card-text>

    <!-- リンク入力用ダイアログ -->
    <v-dialog v-model="linkDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h6">Add Link</span>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="linkUrl"
            label="URL"
            placeholder="https://example.com"
            variant="outlined"
            autofocus
            @keyup.enter="setLink"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="closeLinkDialog"> Cancel </v-btn>
          <v-btn color="primary" variant="flat" @click="setLink" :disabled="!linkUrl"> Add </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
  /* ============================================================
     レイアウト・エディタ基本
     ============================================================ */
  .tiptap-editor-card {
    width: 100%;
  }

  .editor-wrapper {
    position: relative;
    min-height: 300px;
  }

  .editor-content {
    padding: 16px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    min-height: 300px;
    background: white;
    cursor: text;
  }

  /* ============================================================
     Bubble Menu スタイル
     ============================================================ */
  .bubble-menu-modern {
    display: flex;
    align-items: center;
    gap: 2px;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #424242;
  }

  .menu-btn:hover {
    background: #f5f5f5;
    color: #1976d2;
  }

  .menu-btn.is-active {
    background: #e3f2fd;
    color: #1976d2;
  }

  .menu-divider {
    width: 1px;
    height: 24px;
    background: #e0e0e0;
    margin: 0 4px;
  }

  /* ============================================================
     Floating Menu スタイル
     ============================================================ */
  .floating-menu-modern {
    display: flex;
    align-items: center;
    gap: 2px;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 3px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
    /* トランジション効果を追加 */
    opacity: 0;
    transform: translateY(-8px);
    animation: floatingMenuFadeIn 0.3s ease forwards;
  }

  @keyframes floatingMenuFadeIn {
    to {
      opacity: 0.6;
      transform: translateY(0);
    }
  }

  /* マウス進入時に不透明に戻す */
  .floating-menu-modern:hover {
    opacity: 1 !important;
  }

  .floating-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #424242;
  }

  /* テキストボタン用のスタイル */
  .floating-menu-btn-text {
    font-size: 11px;
    font-weight: 600;
    font-family: 'Roboto Mono', monospace;
    letter-spacing: -0.5px;
  }

  .floating-menu-btn:hover {
    background: #f5f5f5;
    color: #1976d2;
  }

  .floating-menu-btn.is-active {
    background: #e3f2fd;
    color: #1976d2;
  }

  .floating-menu-divider {
    width: 1px;
    height: 24px;
    background: #e0e0e0;
    margin: 0 1px;
  }

  /* ============================================================
     ProseMirror / Tiptap 内部スタイル
     ============================================================ */
  :deep(.ProseMirror) {
    min-height: 300px;
    outline: none;
  }

  /* プレースホルダースタイル */
  :deep(.ProseMirror p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }

  :deep(.ProseMirror.is-editor-empty p.is-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }

  :deep(.ProseMirror p) {
    margin-top: 0.1em;
    margin-bottom: 0.1em;
    font-size: 1rem; /* デフォルト文字サイズを少し大きくする */
  }

  :deep(.ProseMirror ul),
  :deep(.ProseMirror ol) {
    padding-left: 1.5em;
    margin: 0.5em 0;
    list-style-position: outside;
  }

  :deep(.ProseMirror li p) {
    margin: 0;
    display: inline-block;
    font-size: 0.95rem;
  }

  :deep(.ProseMirror ul) {
    list-style-type: disc;
  }

  :deep(.ProseMirror ol) {
    list-style-type: decimal;
  }

  :deep(.ProseMirror li) {
    margin: 0.25em 0;
  }

  :deep(.ProseMirror ul ul),
  :deep(.ProseMirror ol ol),
  :deep(.ProseMirror ul ol),
  :deep(.ProseMirror ol ul) {
    margin: 0.25em 0;
    padding-left: 24px;
  }

  /* ブロッククォートスタイル */
  :deep(.ProseMirror blockquote) {
    border-left: 4px solid #1976d2;
    padding-left: 1em;
    margin-left: 0;
    margin-right: 0;
    margin-top: 0.8em;
    margin-bottom: 0.8em;
    color: #616161;
    font-style: italic;
    background: #f5f5f5;
    padding-top: 0.5em;
    padding-bottom: 0.5em;
    border-radius: 0 4px 4px 0;
  }

  :deep(.ProseMirror blockquote p) {
    margin: 0.3em 0;
  }

  :deep(.ProseMirror a.custom-link) {
    color: #1976d2;
    text-decoration: underline;
    cursor: pointer;
  }

  :deep(.ProseMirror a.custom-link:hover) {
    color: #1565c0;
  }

  :deep(.ProseMirror mark.custom-highlight) {
    background-color: #fff59d;
    padding: 0.1em 0.2em;
    border-radius: 2px;
  }

  :deep(.ProseMirror strong) {
    font-weight: bold;
  }

  :deep(.ProseMirror s) {
    text-decoration: line-through;
  }

  /* 見出しスタイル */
  :deep(.ProseMirror h2) {
    font-size: 1.75em;
    font-weight: normal;
    margin-top: 0.8em;
    margin-bottom: 0.4em;
    line-height: 1.1;
  }

  :deep(.ProseMirror h3) {
    font-size: 1.5em;
    font-weight: normal;
    margin-top: 0.6em;
    margin-bottom: 0.3em;
    line-height: 1.1;
  }
</style>
