import { TYPE_OF_LIVESTOCK } from 'ffc-ahwr-common-library'

export const AddressType = {
  ORG_EMAIL: 'orgEmail',
  EMAIL: 'email',
  CC: 'CC'
}

export const LIVESTOCK_TO_READABLE_SPECIES = {
  beef: 'Beef cattle',
  dairy: 'Dairy cattle',
  pigs: 'Pigs',
  sheep: 'Sheep'
}

export const getHerdNameLabel = (typeOfLivestock) =>
  typeOfLivestock === TYPE_OF_LIVESTOCK.SHEEP ? 'Flock name' : 'Herd name'
