<script setup lang="ts">
  import { ref } from 'vue';
  import { type JSONContent } from '@tiptap/core';
  import TiptapEditor from './components/TiptapEditor.vue';

  const contentData = ref<JSONContent>({
    type: 'doc',
    content: [],
  });

  const submit = () => {
    console.log('--- 送信データ (JSON) ---');
    // 第二引数は、replacer、第三引数の２は、インデント用のスペース数
    console.log(JSON.stringify(contentData.value, null, 2));

    alert('コンソールにJSONを出力しました。データ送信処理をここに記述します。');
  };

  // クリアボタンの処理
  const clearContent = () => {
    contentData.value = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    };
  };
</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="10">
            <h1 class="text-h4 mb-4 ml-4">記事編集画面</h1>

            <v-card class="pa-4">
              <!-- エディタコンポーネントの配置 -->
              <!-- v-model で contentData と同期します -->
              <TiptapEditor v-model="contentData" :max-limit="1000" />

              <!-- 外側に配置したアクションボタン -->
              <v-card-actions class="mt-4 px-0">
                <v-btn color="error" variant="text" @click="clearContent"> リセット </v-btn>

                <v-spacer />

                <v-btn color="primary" size="large" prepend-icon="mdi-content-save" @click="submit">
                  保存する
                </v-btn>
              </v-card-actions>
            </v-card>

            <!-- デバッグ用: リアルタイムデータの確認 -->
            <v-expansion-panels class="mt-6">
              <v-expansion-panel title="現在のJSONデータを確認">
                <v-expansion-panel-text>
                  <pre class="json-preview">{{ contentData }}</pre>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
  .json-preview {
    background-color: #f5f5f5;
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.8rem;
    font-family: monospace;
  }
</style>
