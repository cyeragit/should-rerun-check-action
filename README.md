# ReRuns Checks on PRs

Verify if a specific check needs to be rerun on a specific PR, and re-runs if needed.
   
## Usage


## Inputs

|               Input               |         type         | required |        default        |                                      description                                      |
|:---------------------------------:|:--------------------:|:--------:|:---------------------:|:-------------------------------------------------------------------------------------:|
|               token               |       `string`       |  `true`  | `${{ github.token }}` |                                                                                       |
|             base_branch           |       `string`       |  `true`  |                       |                            The base branch to compare with                            |
|              pr_number            |       `string`       |  `true`  |                       |                            The PR number to check                                     |
|              check_name           |       `string`       |  `true`  |                       |                            The check name to verify on PR                             |
|    number_of_required_approves    |       `string`       |  `true`  |                       |                            The number of required approves on a PR                    |

