locals {
  variables = {
    user_group_name         = "home_user_group"
    user_email = "raph.aelluckom@gmail.com"
    cognito_system_id = local.system_ids.test.admin
  }
}
