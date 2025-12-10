export const REVIEW_CATTLE = [
  'the test results (positive or negative)',
  'if a blood (serum) antibody test was done, the summary must also include the number of animals samples were taken from'
]

export const REVIEW_PIGS = [
  'the number of oral fluid samples that were tested and the test results (positive or negative)',
  'the number of animals that samples were taken from'
]

export const REVIEW_SHEEP = [
  'the number of lambs or animals under 12 months that samples were taken from the test results'
]

const REVIEW_TEST_RESULTS_WITHIN_10_MONTHS =
  'the test results from the review carried out within the last 10 months'
const CONFIRMATION_BIOSECURITY_ASSESSMENT =
  'confirmation that the vet carried out biosecurity assessment'

export const FOLLOW_UP_CATTLE_POSITIVE = [
  REVIEW_TEST_RESULTS_WITHIN_10_MONTHS,
  'the date the vet took the samples for testing of the cattle',
  'confirmation that a persistently infected (PI) hunt was carried out, for all cattle in the herd, by blood sampling for virus or BVD tissue (button tag) sampling, or a combination of both',
  'test results from the follow-up (positive or negative)',
  'the laboratory unique reference number (URN) or certificate number for the test results',
  CONFIRMATION_BIOSECURITY_ASSESSMENT
]

export const FOLLOW_UP_CATTLE_NEGATIVE = [
  REVIEW_TEST_RESULTS_WITHIN_10_MONTHS,
  CONFIRMATION_BIOSECURITY_ASSESSMENT
]

export const FOLLOW_UP_CATTLE_NEGATIVE_RECOMMENDED_PI_HUNT = [
  REVIEW_TEST_RESULTS_WITHIN_10_MONTHS,
  'the date the vet took the samples for testing of the cattle',
  'confirmation that a persistently infected (PI) hunt was carried out, for all cattle in the herd, by blood sampling for virus or BVD tissue (button tag) sampling, or a combination of both',
  'test results from the follow-up (positive or negative)',
  'the laboratory unique reference number (URN) or certificate number for the test results',
  CONFIRMATION_BIOSECURITY_ASSESSMENT,
  'confirmation that the vet recommended the PI hunt'
]

export const FOLLOW_UP_PIGS = [
  REVIEW_TEST_RESULTS_WITHIN_10_MONTHS,
  'the date the vet took the samples for testing of the pigs',
  'the number of animals samples were taken from the number of blood (serum) samples tested',
  'the disease status category',
  'the laboratory unique reference number (URN) for the test results',
  'the herd vaccination status',
  'confirmation that the vet carried out a biosecurity assessment, and if so, the biosecurity assessment score (%)'
]

export const FOLLOW_UP_SHEEP = [
  'the dates samples were taken or the vet assessed the condition of the sheep',
  'the number of sheep assessed or that samples were taken from',
  'the name of the sheep health package chosen',
  'the diseases and conditions tested or assessed',
  'the test results'
]
