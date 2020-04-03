<template>
  <div class="modules-deploy">
    <v-header
      :title="contents.title"
      :breadcrumb="breadcrumb"
      icon="backup"
    ></v-header>

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

    <div v-if="deploying" class="modules-deploy-deploying">
      <h2>
        Currently deploying {{ production ? "production" : "development" }}
      </h2>
      <h3>{{ getData("created_at") | relativize | capitalize }}</h3>
      <h4>
        {{ getData("title") }}
        {{ getData("committer") ? `by ${getData("committer")}` : "" }}
      </h4>
    </div>

    <div v-if="error">
      <h2>Error</h2>
      <p>Whoops, something went wrong! Try again later...</p>
    </div>

    <div
      v-else-if="productionData"
      class="modules-help-content animated fadeIn"
    >
      <section>
        <div class="modules-deploy-status-header">
          <h2>Site status</h2>
          <v-switch
            v-model="production"
            color="--green"
            :label="production ? 'Showing prod' : 'Showing dev'"
            @click.native="checkDeployStatus()"
          />
          <v-button>Refresh</v-button>
        </div>

        <h3
          :class="[
            'modules-deploy-status',
            production ? 'modules-warning' : 'modules-accent'
          ]"
        >
          {{ production ? "Production" : "Development" }} status
        </h3>
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
          {{ production ? "production" : "development" }} release with the
          latest data from this instance. Use with care.
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
          >Deploy {{ production ? "production" : "development" }}</v-button
        >

        <portal v-if="overlay" to="modal">
          <v-confirm
            :message="
              production
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

    <v-info-sidebar wide item-detail>
      <section class="info-sidebar-section">
        <h2>{{ contents.subtitle }}</h2>

        <ol class="modules-history-list">
          <li v-for="dep in getDataList()" :key="dep.id">
            <strong>{{ dep.created_at | relativize | capitalize }}:</strong
            ><br />
            <p>{{ dep.title ? dep.title : "No message" }}</p>
          </li>
        </ol>
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
        subtitle: "Deploy history"
      },
      loading: true,
      error: false,
      message: null,
      user: null,
      overlay: false,
      deploying: false,
      productionData: null,
      developmentData: null,
      production: false
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
    getDataList() {
      return this.production ? this.productionData : this.developmentData;
    },
    getData(data) {
      return get(
        this.production ? this.productionData[0] : this.developmentData[0],
        data
      );
    },
    checkDeployStatus() {
      if (
        this.getDataList()[0].state === "building" ||
        this.getDataList()[0].state === "enqueued"
      ) {
        this.deploying = true;
      } else {
        this.deploying = false;
      }
    },
    deploy() {
      const message = `${this.message} by ${this.user}`;
      const formatTitle = message.replace(/ /g, "+");
      axios
        .post(
          `https://api.netlify.com/build_hooks/${
            this.production ? process.env.PROD_HOOK : process.env.DEV_HOOK
          }?trigger_title=${formatTitle}`
        )
        .then(async () => {
          this.overlay = false;
          await this.load();
        })
        .catch(err => console.log(err))
        .finally(() => {
          this.checkDeployStatus();
        });
    },
    async load() {
      this.loading = true;
      this.user = this.$store.state.currentUser.first_name;
      await axios
        .all([
          instance.get(
            `/sites/${process.env.SITE_ID}/deploys?page=1&per_page=10&branch=master&match=true`
          ),
          instance.get(
            `/sites/${process.env.SITE_ID}/deploys?page=1&per_page=10&branch=develop&match=true`
          )
        ])
        .then(
          axios.spread((prod, dev) => {
            this.productionData = prod.data;
            this.developmentData = dev.data;
          })
        )
        .catch(err => {
          this.error = true;
          console.error(err);
        })
        .finally(() => {
          this.checkDeployStatus();
          this.loading = false;
        });
    },
    debug() {
      console.log(JSON.stringify(this.productionData, null, 2));
      console.log(JSON.stringify(this.developmentData, null, 2));
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

.modules-deploy-status {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  max-width: 250px;
}

.modules-warning {
  background-color: var(--warning);
}

.modules-accent {
  background-color: var(--accent);
}

.modules-deploy-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 350px);
}

.modules-deploy-deploying {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: var(--page-padding);
  background-color: var(--success);
  border-radius: 15px;
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

.modules-history-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}
</style>
