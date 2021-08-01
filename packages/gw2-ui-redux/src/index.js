import { createDriver } from '@redux-requests/axios'
import { handleRequests as reduxRequestsHandleRequests } from '@redux-requests/core'
import axios from 'axios'
import { BASE_URL } from './constants'
import gw2uiReducer from './gw2-ui-slice'

export const gw2UIReducer = gw2uiReducer

export { addItem, addSkill, addSpecialization, addTrait } from './gw2-ui-slice'

export {
  fetchItem,
  fetchItems,
  fetchSkill,
  fetchSkills,
  fetchSpecialization,
  fetchSpecializations,
  fetchTrait,
  fetchTraits,
} from './actions'
export {
  FETCH_ITEM,
  FETCH_ITEMS,
  FETCH_SKILL,
  FETCH_SKILLS,
  FETCH_SPECIALIZATION,
  FETCH_SPECIALIZATIONS,
  FETCH_TRAIT,
  FETCH_TRAITS,
} from './constants'
export const handleRequests = ({ ssr = false } = {}) =>
  reduxRequestsHandleRequests({
    driver: createDriver(
      axios.create({
        baseURL: BASE_URL,
      }),
    ),
    cache: true,
    ssr: ssr ? 'server' : 'client',
    // since ids are not unique accross e.g. items and skills, this defines a custom identifier
    // used by the normalization process of redux-requests
    getNormalisationObjectKey: (obj) => `${obj.id}_${obj.gw2UIType}`,
  })
