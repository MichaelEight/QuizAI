STATUS_LABEL = 'status'
STATUS_ERROR = 'error'

def err_msg(print_error_msgs, msg):
    if(print_error_msgs):
        print(msg)

def validate_api_response(api_response, print_error_msgs = False):
    if not api_response:
        err_msg(print_error_msgs, "error - empty api response")
        return False
    if isinstance(api_response, dict) and api_response.get(STATUS_LABEL) == STATUS_ERROR:
        err_msg(print_error_msgs, "error - status error detected")
        return False 
    if not isinstance(api_response, (dict, list)):
        err_msg(print_error_msgs, "error - response is not a dict or a list")
        return False
    return True