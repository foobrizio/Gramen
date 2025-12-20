import {startBot} from "./bot/botManager";
import configLoader from "./util/config_loader";
import { initLogger } from "./util/logger";

initLogger(configLoader.logs_path);
startBot()