<template>
  <div class="modules-deploy">
    <v-header
      :title="this.contents.title"
      :breadcrumb="breadcrumb"
      icon="backup"
    ></v-header>
    <div class="modules-deploy-content"></div>

    <div class="modules-deploy-loading" v-if="loading">
      <div class="flex-item">
        <v-spinner
          x-large
          v-show="loading"
          line-fg-color="var(--blue-grey-300)"
          line-bg-color="var(--blue-grey-200)"
          class="spinner"
        >
        </v-spinner>
      </div>
    </div>

    <div v-if="error">
      <h2>Error</h2>
      <p>Whoops, something went wrong! Try again later...</p>
    </div>

    <div class="modules-help-content animated fadeIn" v-else-if="siteProd">
      <section>
        <h2>Site status</h2>
      </section>

      <section>
        <h2>Deploy</h2>
        <v-button
          color="--white"
          background-color="--green"
          hover-background-color="--green-800"
          large
        >
          Production
        </v-button>

        <v-button
          color="--blue-grey-800"
          background-color="--blue-grey-50"
          hover-color="--red"
          hover-background-color="--white"
          large
        >
          Development
        </v-button>
      </section>
    </div>

    <v-info-sidebar wide>
      <section class="info-sidebar-section">
        <h2 class="font-accent">{{ this.contents.subtitle }}</h2>
        <p class="p">{{ this.contents.description }}</p>
      </section>
    </v-info-sidebar>
  </div>
</template>

<script>
import { get } from "lodash";
import axios from "axios";

const instance = axios.create({
  baseURL: "https://api.netlify.com/api/v1"
});
instance.interceptors.request.use(config => {
  config.params = {
    access_token: process.env.NETLIFY_KEY,
    ...config.params
  };
  return config;
});

export default {
  name: "Deploy website",
  computed: {
    breadcrumb() {
      return [];
    }
  },
  methods: {
    load() {
      this.loading = true;

      axios
        .all([
          instance.get(`/sites/${process.env.SITE_ID}`),
          instance
            .get(`/sites/${process.env.SITE_ID}/deployed-branches`)
            .then(res => {
              const dev = res.data.filter(obj => obj.name === "develop")[0];
              return instance.get(
                `/sites/${process.env.SITE_ID}/deploys/${dev.deploy_id}`
              );
            })
        ])
        .then(
          axios.spread((prod, dev) => {
            this.siteProd = prod.data;
            this.siteDev = dev.data;
            this.render();
          })
        )
        .catch(err => {
          this.error = true;
          console.error(err);
        })
        .finally(() => (this.loading = false));
    },
    onClick(path) {
      this.$router.push(path);
    },
    render() {
      console.log(JSON.stringify(this.siteProd, null, 2));
      console.log(JSON.stringify(this.siteDev, null, 2));
      return this.siteProd;
    }
  },
  data() {
    return {
      contents: {
        title: "Deploy website",
        subtitle: "Build and deploy website using Netlify",
        description: "Blah blah blah"
      },
      loading: true,
      error: false,
      siteProd: null,
      siteDev: null
    };
  },
  metaInfo() {
    return {
      title: this.contents.title,
      subtitle: this.contents.subtitle
    };
  },
  mounted() {
    this.load();
  }
};
</script>

<style lang="scss" scoped>
.modules-deploy {
  padding: var(--page-padding);
}

h2 {
  font-size: x-large;
}

.v-spinner {
  margin: auto;
}

.modules-deploy-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 350px);
}
</style>
