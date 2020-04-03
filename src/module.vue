<template>
  <div class="modules-deploy">
    <v-header
      :title="contents.title"
      :breadcrumb="breadcrumb"
      icon="backup"
    ></v-header>
    <div class="modules-deploy-content"></div>

    <div v-if="loading" class="modules-deploy-loading">
      <div class="flex-item">
        <v-spinner
          v-show="loading"
          x-large
          line-fg-color="var(--blue-grey-300)"
          line-bg-color="var(--blue-grey-200)"
          class="spinner"
        />
      </div>
    </div>

    <div v-if="deploying">
      <h2>Currently deploying!</h2>
    </div>

    <div v-if="error">
      <h2>Error</h2>
      <p>Whoops, something went wrong! Try again later...</p>
    </div>

    <div v-else-if="siteProd" class="modules-help-content animated fadeIn">
      <section>
        <div class="modules-deploy-status-header">
          <h2>Site status</h2>
          <v-switch
            v-model="showProd"
            color="--green"
            :label="showProd ? 'Showing prod' : 'Showing dev'"
          />
        </div>

        <h3>{{ showProd ? "Production" : "Development" }} status</h3>
        <dl>
          <dt>
            <strong>Deployment status</strong>
          </dt>
          <dd>Last deploy {{ getData("created_at") | relativize }}</dd>
          <dt>
            <strong>Deployment Message</strong>
          </dt>
          <dd>{{ getData("title") }}</dd>
          <dt>
            <strong>Deployment data</strong>
          </dt>
          <dd>
            <dl>
              <dt>
                <strong>Status</strong>
              </dt>
              <dd>{{ getData("summary.status") | capitalize }}</dd>
              <dt>
                <strong>Updates</strong>
              </dt>
              <dd>{{ getData("summary.messages[0].title") }}</dd>
              <dd>{{ getData("summary.messages[0].description") }}</dd>
              <dt>
                <strong></strong>
              </dt>
              <dd></dd>
            </dl>
          </dd>
        </dl>
      </section>

      <section>
        <h2>Deploy</h2>
        <p style="padding-bottom: calc(var(--page-padding) / 3);">
          This will build and deploy a
          {{ showProd ? "production" : "development" }} release with the latest
          data from instance. Use with care.
        </p>
        <v-input
          v-model="message"
          placeholder="Deployment message"
          style="margin-bottom: var(--page-padding)"
        ></v-input>
        <dl v-if="message">
          <dt>
            <strong>Deploy message</strong>
          </dt>
          <dd>{{ message }} by {{ user }}</dd>
        </dl>
        <v-button
          color="--white"
          background-color="--green"
          hover-background-color="--green-800"
          :disabled="!Boolean(message)"
          large
          @click="overlay = true"
          >Deploy {{ showProd ? "production" : "development" }}</v-button
        >

        <portal v-if="overlay" to="modal">
          <v-confirm
            :message="
              showProd
                ? 'Please confirm that you want to deploy to production'
                : 'Please confirm that you want to deploy to development'
            "
            :loading="loading"
            confirm-text="Deploy"
            @cancel="overlay = false"
            @confirm="deploy"
          ></v-confirm>
        </portal>
      </section>
    </div>

    <v-info-sidebar wide item-details />
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
  name: "DeployWebsite",
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
  data() {
    return {
      contents: {
        title: "Deploy website",
        subtitle: "Deploy history",
        description: "Blah blah blah"
      },
      loading: true,
      error: false,
      message: null,
      user: null,
      overlay: false,
      deployed: true,
      deploying: false,
      siteProd: null,
      siteDev: null,
      showProd: true
    };
  },
  computed: {
    breadcrumb() {
      return [];
    }
  },
  mounted() {
    this.load();
  },
  methods: {
    getData(data) {
      return get(this.showProd ? this.siteProd[0] : this.siteDev[0], data);
    },
    deploy() {
      const message = `${this.message} by ${this.user}`;
      const formatTitle = message.replace(/ /g, "+");
      axios
        .post(
          `https://api.netlify.com/build_hooks/${
            this.showProd ? process.env.PROD_HOOK : process.env.DEV_HOOK
          }?trigger_title=${formatTitle}`
        )
        .then(() => (this.deployed = true))
        .catch(err => console.log(err));
    },
    load() {
      this.loading = true;

      this.user = this.$store.state.currentUser.first_name;
      axios
        .all([
          instance.get(`/sites/${process.env.SITE_ID}`).then(res => {
            return instance.get(
              `/sites/${process.env.SITE_ID}/deploys?page=1&per_page=10?branch=master?match=true`
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
  metaInfo() {
    return {
      title: this.contents.title,
      subtitle: this.contents.subtitle
    };
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
