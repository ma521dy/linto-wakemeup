<template>
  <div class="h-100">
    <div id="page-content" >
      <div class="container-fluid" id="user-panel">
        <div class="row justify-content-around">
          <div class="col-xl-4 col-lg-12 col-md-12" v-if="appStatsReady">
            <h2>Statistiques d'utilisation</h2>
            <div class="white-container">
              <div class="row">
                <div class="col monitoring-appstats record">
                  <span class="label">Nombre d'enregistrements</span>
                  <span class="icon"></span>
                  <span class="number">{{ appStats.nbRecord }}</span>
                </div>
                <div class="col monitoring-appstats listen">
                  <span class="label">Nombre d'écoutes</span>
                  <span class="icon"></span>
                  <span class="number">{{ appStats.nbListen }}</span>
                </div>
              </div>
            </div>
            <h2>Détails par wakeword</h2>
            <div class="white-container">
              <div v-for="ww in scenarios" :key="ww._id" class="ww-container">
                <span class="wakeword">{{ ww.wakeword }}</span>
                <div class="wakeword-info">
                  <span class="label listen">Ecoutes</span>
                  <span class="number listen">{{ww.nbListen}}</span>
                </div>
                <div class="wakeword-info">
                  <span class="label record">Enreg.</span>
                  <span class="number record">{{ww.nbRecord}}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="col-xl-3 col-lg-6 col-md-6 col-sm-12" v-if="genderRatioReady">
            <h2>Répartition femme / homme</h2>
            <div class="white-container">
              <canvas id="genderRatio" width="400" height="400">Your browser does not support the canvas element.</canvas>
              <span class="monitoring-datas">Hommes: {{ genderRatio.pctMale.toFixed(1) }} % <br/> Femmes: {{ genderRatio.pctFemale.toFixed(1) }} %</span>
            </div>
          </div>
          <div class="col-xl-3 col-lg-6 col-md-6 col-sm-12" v-if="deviceRatioReady">
            <h2>Types de microphone</h2>
            <div class="white-container">
              <canvas id="devicesRatio" width="400" height="400">Your browser does not support the canvas element.</canvas>
              <span class="monitoring-datas">
                Micro par défault: {{ deviceRatio.prctDefault.toFixed(1) }}% <br/>
                Micro-casque: {{ deviceRatio.prctHeadphone.toFixed(1) }}% <br/>
                Micro à pied: {{ deviceRatio.prctExternal.toFixed(1) }}% <br/>
                Smartphone: {{ deviceRatio.prctSmartphone.toFixed(1) }}%
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
<script>
import Chart from 'chart.js'
import { bus } from '../main.js'
import { months } from 'moment'
export default {
  data () {
    return {
      scenariosReady: false,
      appStatsReady: false,
      genderRatio: '',
      genderRatioReady: false,
      deviceRatio: '',
      deviceRatioReady: false
    }
  },
  computed: {
    scenarios () {
      return this.$store.state.scenarios
    },
    appStats () {
      return this.$store.getters.APP_STATS
    },
    audios () {
      return this.$store.state.audios
    }
  },
  created () {
    this.$store.dispatch('getScenarios').then((resp) => {
      if (!!resp.error) {
        bus.$emit('notify_app', {
          status: 'error',
          msg: 'Une erreur est survenue en voulant contacter la base de données. Si le problème persiste veuillez contacter un administrateur.',
          redirect: false
        })
      }
    })
    this.$store.dispatch('getAudios').then((resp) => {
      if (!!resp.error) {
        bus.$emit('notify_app', {
          status: 'error',
          msg: 'Une erreur est survenue en voulant contacter la base de données. Si le problème persiste veuillez contacter un administrateur.',
          redirect: false
        })
      }
    })
  },
  watch: {
    scenarios: function (data) {
      if (data.length > 0) {
        this.scenariosReady = true
      }
    },
    appStats: function (data) {
      this.appStatsReady = true
    },
    audios: function (data) {
      if (data.length > 0) {
        this.genderRatio = this.$store.getters.GENDER_RATIO
        this.deviceRatio = this.$store.getters.DEVICES_RATIO
        this.recordByDay = this.$store.getters.RECORD_BY_DAY
      }
    },
    genderRatio: function (data) {
      this.genderRatioReady = true
      setTimeout(() => {
        this.setGenderChart()
      }, 500)
    },
    deviceRatio: function (data) {
      this.deviceRatioReady = true
      setTimeout(() => {
        this.setDevicesChart()
      }, 500)
    }
  },
  methods: {
    setGenderChart () {
      this.createChart('genderRatio', {
        type: 'pie',
        data: {
          labels: ['Hommes', 'Femmes'],
          datasets: [{
            data: [this.genderRatio.pctMale, this.genderRatio.pctFemale],
            backgroundColor: ['#7ee557', '#ed4877']
          }]
        },
        options: {}
      })
    },
    setDevicesChart () {
      this.createChart('devicesRatio', {
        type: 'pie',
        data: {
          labels: ['Default', 'Micro-casque', 'Micro à pied', 'Smartphone'],
          datasets: [{
            data: [this.deviceRatio.prctDefault, this.deviceRatio.prctHeadphone, this.deviceRatio.prctExternal, this.deviceRatio.prctSmartphone],
            backgroundColor: ['#7ee557', '#ed4877', '#22a8f2']
          }]
        },
        options: {}
      })
    },
    createChart (chartId, chartData) {
      const ctx = document.getElementById(chartId)
      return new Chart(ctx, {
        type: chartData.type,
        data: chartData.data,
        options: chartData.options
      })
    }
  }
}
</script>
