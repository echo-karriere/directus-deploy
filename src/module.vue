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
        />
      </div>
    </div>

    <div v-if="error">
      <h2>Error</h2>
      <p>Whoops, something went wrong! Try again later...</p>
    </div>

    <div class="modules-help-content animated fadeIn" v-else-if="siteProd">
      <section>
        <div class="modules-deploy-status-header">
          <h2>Site status</h2>
          <v-switch
            v-model="showProd"
            color="--green"
            :label="this.showProd ? 'Showing prod' : 'Showing dev'"
          />
        </div>

        <h3>{{ this.showProd ? "Production" : "Development" }} status</h3>
        <dl>
          <dt><strong>Deployment status</strong></dt>
          <dd>Last deploy {{ getData("updated_at") | relativize }}</dd>
          <dt><strong>Deployment Message</strong></dt>
          <dd>{{ getData("title") }}</dd>
          <dt><strong>Deployment commit</strong></dt>
          <dd>
            <a :href="getData('commit_url')">{{ getData("title") }}</a> by
            {{ getData("committer") }} on branch {{ getData("branch") }}
          </dd>
          <dt><strong>Deployment data</strong></dt>
          <dd>
            <dl>
              <dt><strong>Status</strong></dt>
              <dd>{{ getData("summary.status") | capitalize }}</dd>
              <dt><strong>Updates</strong></dt>
              <dd>{{ getData("summary.messages[0].title") }}</dd>
              <dd>{{ getData("summary.messages[0].description") }}</dd>
              <dt><strong></strong></dt>
              <dd></dd>
            </dl>
          </dd>
        </dl>
      </section>

      <section>
        <h2>Deploy</h2>
        <v-input
          v-model="message"
          placeholder="Deployment message"
          style="margin-bottom: var(--page-padding)"
        ></v-input>
        <dl v-if="message">
          <dt><strong>Deploy message</strong></dt>
          <dd>{{ message }} by {{ this.user }}</dd>
        </dl>

        <v-button
          color="--white"
          background-color="--green"
          hover-background-color="--green-800"
          :disabled="!Boolean(this.message)"
          @click="overlay = true"
          large
          >Deploy {{ this.showProd ? "production" : "development" }}</v-button
        >

        <portal v-if="overlay" to="modal">
          <v-confirm
            :message="
              this.showProd
                ? 'Please confirm that you want to deploy to production'
                : 'Please confirm that you want to deploy to development'
            "
            :loading="loading"
            @cancel="overlay = false"
            @confirm="logout"
          >
          </v-confirm>
        </portal>
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
import get from "lodash/get";
import axios from "axios";
import formatRelative from "date-fns/formatRelative";
import parseISO from "date-fns/parseISO";
import enGB from "date-fns/locale/en-GB";

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
  filters: {
    relativize: function(date) {
      return formatRelative(parseISO(date), new Date(), {
        locale: enGB
      });
    },
    capitalize: function(input) {
      return input.charAt(0).toUpperCase() + input.slice(1);
    }
  },
  methods: {
    getData(data) {
      return get(this.showProd ? this.siteProd : this.siteDev, data);
    },
    load() {
      this.loading = true;

      this.user = this.$store.state.currentUser.first_name;
      axios
        .all([
          instance.get(`/sites/${process.env.SITE_ID}`).then(res => {
            const deploy_id = res.data.deploy_id;
            return instance.get(
              `/sites/${process.env.SITE_ID}/deploys/${deploy_id}`
            );
          }),
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
    render() {
      console.log(JSON.stringify(this.siteProd, null, 2));
      console.log(JSON.stringify(this.siteDev, null, 2));
      console.log(JSON.stringify(this.$store.state.currentUser, null, 2));
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
      message: null,
      user: null,
      overlay: false,
      siteProd: null,
      siteDev: null,
      showProd: true
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
  padding: calc(var(--page-padding) / 2) 0;
}

h3 {
  font-size: large;
  padding: calc(var(--page-padding) / 2) 0;
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

.modules-deploy-status-header {
  display: flex;
  h2 {
    padding-right: var(--page-padding);
  }
}

strong {
  font-weight: 800;
}

dl > dt {
  font-weight: normal;
  font-style: oblique;
}

dd {
  padding-left: var(--page-padding);
  margin-bottom: var(--input-padding);
}
</style>
