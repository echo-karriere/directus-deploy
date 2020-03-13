<template>
  <div class="modules-deploy">
    <v-header
      :title="content('title')"
      :breadcrumb="breadcrumb"
      icon="backup"
    ></v-header>
    <div class="modules-deploy-content"></div>

    <div class="modules-help-loading" v-if="loading">
      <div class="flex-item">
        <v-spinner
          v-show="loading"
          line-fg-color="var(--blue-grey-300)"
          line-bg-color="var(--blue-grey-200)"
          class="spinner"
        >
        </v-spinner>
      </div>
    </div>

    <v-info-sidebar wide>
      <section class="info-sidebar-section">
        <h2 class="font-accent" v-html="content('title')"></h2>
        <p class="p" v-html="content('description')"></p>
      </section>
    </v-info-sidebar>
  </div>
</template>

<script>
import { get } from "lodash";

export default {
  name: "Deploy website",
  computed: {
    breadcrumb() {
      return [];
    }
  },
  methods: {
    content(input) {
      let translation = get(this.contents, this.locale);
      translation = translation || get(this.contents, "en-US");
      return get(translation, input);
    },
    load() {
      this.loading = true;

      this.$api.api
        .get("/custom/analytics/dashboard")
        .then(response => {
          this.loading = false;

          this.analytics = response;
        })
        .catch(error => {
          this.error = error;

          this.loading = false;
        });
    },
    onClick(path) {
      this.$router.push(path);
    },
    render() {
      let rect = this.$content.getBoundingClientRect();
      let height = window.innerHeight - rect.y - 10;

      this.$content.style.minHeight = `${height}px`;

      this.load();
    }
  },
  data() {
    return {
      contents: {
        "en-US": {
          title: "Deploy website",
          subtitle: "Build and deploy website using Netlify",
          description: "Blah blah blah"
        }
      }
    };
  },
  metaInfo() {
    return {
      title: this.content("title"),
      subtitle: this.content("subtitle")
    };
  },
  mounted() {
    this.$content = this.$el.querySelector(".modules-deploy-content");

    if (this.$content) this.render();
  }
};
</script>

<style lang="scss" scoped>
.modules-deploy {
  padding: var(--page-padding);
}
</style>
