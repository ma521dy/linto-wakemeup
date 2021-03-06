/*
 * Copyright (c) 2017 Linagora.
 *
 * This file is part of Business-Logic-Server
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
const debug = require('debug')('linto-admin:routes')

module.exports = (webServer) => {
  return {
    "/": require('./home')(webServer),
    "/admin": require('./admin')(webServer),
    "/api/audios": require('./api/audios')(webServer),
    "/api/user": require('./api/user')(webServer),
    "/api/contact": require('./api/contact')(webServer),
    "/api/scenarios": require('./api/scenarios')(webServer),
    "/contact": require('./home')(webServer),
    "/interface": require('./interface')(webServer),
    "/login": require('./login')(webServer),
    "/logout": require('./logout')(webServer),
    "/mentions-legales": require('./home')(webServer),
    "/cgu": require('./home')(webServer),
    "/reinit-password": require('./reinit-password')(webServer)
  }
}
