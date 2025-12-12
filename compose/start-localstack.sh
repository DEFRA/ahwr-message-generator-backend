#!/bin/bash
export AWS_REGION=eu-west-2
export AWS_DEFAULT_REGION=eu-west-2
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

function create_topic() {
  local topic_name=$1
  local topic_arn=$(awslocal sns create-topic --name $topic_name --query "TopicArn" --output text)
  echo $topic_arn
}

function create_queue() {
  local queue_name=$1

  # Create the DLQ
  local dlq_url=$(
    awslocal sqs create-queue \
    --queue-name "$queue_name-dead-letter-queue" \
    --query "QueueUrl" --output text
  )

  local dlq_arn=$(
    awslocal sqs get-queue-attributes \
      --queue-url $dlq_url \
      --attribute-name "QueueArn" \
      --query "Attributes.QueueArn" \
      --output text
  )

  # Create the queue with DLQ attached
  local queue_url=$(
    awslocal sqs create-queue \
      --queue-name $queue_name \
      --attributes '{ "RedrivePolicy": "{\"deadLetterTargetArn\":\"'$dlq_arn'\",\"maxReceiveCount\":\"1\"}" }' \
      --query "QueueUrl" \
      --output text
  )

  local queue_arn=$(
    awslocal sqs get-queue-attributes \
      --queue-url $queue_url \
      --attribute-name "QueueArn" \
      --query "Attributes.QueueArn" \
      --output text
  )

  echo $queue_arn
}

function subscribe_queue_to_topic() {
  local topic_arn=$1
  local queue_arn=$2

  awslocal sns subscribe --topic-arn $topic_arn --protocol sqs --notification-endpoint $queue_arn --attributes '{ "RawMessageDelivery": "true" }'
}

function create_queue_subscribe_to_topic() {
  local queue_name=$1
  local topic_arn=$2

  local queue_arn=$(create_queue $queue_name)

  subscribe_queue_to_topic $topic_arn $queue_arn
}

# Inbound
create_queue_subscribe_to_topic "ahwr_message_generator_queue" $(create_topic "ahwr_document_created")
create_queue_subscribe_to_topic "ahwr_message_generator_queue" $(create_topic "ahwr_status_change")
create_queue_subscribe_to_topic "ahwr_message_generator_queue" $(create_topic "ahwr_reminder_request")

# Outbound
create_queue_subscribe_to_topic "ahwr_sfd_message_queue" $(create_topic "ahwr_message_request")

awslocal s3 mb s3://ahwr-documents
awslocal s3 cp /tmp/IAHW-896I-FTN9.pdf s3://ahwr-documents/987654321/IAHW-896I-FTN9.pdf

wait

echo "Queues.."
awslocal sqs list-queues
echo "Topics.."
awslocal sns list-topics
echo "Subscriptions.."
awslocal sns list-subscriptions
echo "Bucket files..."
awslocal s3 ls s3://ahwr-documents --recursive


echo "AWS resources ready!"

# Send some inputs
awslocal sns publish --topic-arn arn:aws:sns:eu-west-2:000000000000:ahwr_reminder_request --message '{"reminderType":"notClaimed_nineMonths","crn":"1060000000","sbi":"987654321","agreementReference":"IAHW-ABC1-1061","emailAddresses":["defra-vets-visits-testing@equalexperts.com"]}' --message-attributes '{"eventType":{"DataType":"String","StringValue":"uk.gov.ffc.ahwr.reminder.request"}}'
awslocal sns publish --topic-arn arn:aws:sns:eu-west-2:000000000000:ahwr_status_change --message '{"crn":"1060000000","sbi":"987654321","agreementReference":"IAHW-ABC1-1061","claimReference":"REPI-ABC1-XYZ1","claimStatus":"IN_CHECK","claimType":"REVIEW","typeOfLivestock":"pigs","reviewTestResults":"positive","claimAmount":"456","dateTime":"2025-12-01T14:22:45.123Z","herdName":"piglets"}' --message-attributes '{"eventType":{"DataType":"String","StringValue":"uk.gov.ffc.ahwr.claim.status.update"}}'
awslocal sns publish --topic-arn arn:aws:sns:eu-west-2:000000000000:ahwr_document_created --message '{"crn":"1060000000","sbi":"987654321","applicationReference":"IAHW-896I-FTN9","documentLocation":"987654321/IAHW-896I-FTN9.pdf","userType":"newUser"}' --message-attributes '{"eventType":{"DataType":"String","StringValue":"uk.gov.ffc.ahwr.document.created"}}'

