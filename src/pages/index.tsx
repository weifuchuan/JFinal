import { BACK_WHITE, ICON_BLUE } from '@/themes/color';
import StatusBar from '@/components/StatusBar';
import FeedbackPage from '@/pages/ContentPage/Feedback';
import ProjectPage from '@/pages/ContentPage/Project';
import SharePage from '@/pages/ContentPage/Share';
import EditArticle from '@/pages/EditArticle';
import Friends from '@/pages/Friends';
import Message from '@/pages/Message';
import SendMessage from '@/pages/Message/SendMessage';
import MyArticles from '@/pages/MyArticles';
import MyFavorite from '@/pages/MyFavorite';
import UpdatePassword from '@/pages/UpdatePassword';
import UploadAvatar from '@/pages/UploadAvatar';
import User from '@/pages/User';
import MyRouter from '@/router';
import { Toast } from 'antd-mobile-rn';
import { autorun, IReactionDisposer } from 'mobx';
import { inject, observer } from 'mobx-react/native';
import * as React from 'react';
import { BackHandler, PushNotificationIOS } from 'react-native';
import PushNotificationHandler from 'react-native-push-notification';
import { Actions, Router, Scene, SceneProps, Stack, Tabs } from 'react-native-router-flux';
import { Store } from '@/store/index';
import { req } from '@/store/web';
import Home from './Home';
import Feedback from './Home/Feedback';
import Me from './Home/Me';
import Project from './Home/Project';
import Search from './Home/Search';
import Share from './Home/Share';
import Login from './Login';
import Reg from './Reg';
import Doc from './Doc';
const cheerio: CheerioAPI = require('react-native-cheerio');

@inject('store')
@observer
export default class App extends React.Component<{
	store?: Store;
}> {
	render() {
		return (
			<Router backAndroidHandler={this.doubleBackThenExit}>
				<Stack hideNavBar>
					<Tabs
						key={'home'}
						lazy={true}
						tabBarPosition={'bottom'}
						tabBarComponent={Home}
						hideNavBar
						{...({
							initial: true
						} as SceneProps) as any}
					>
						<Scene
							key={'project'}
							hideNavBar
							initial
							component={Project}
							onEnter={() => {
								this.pushCommonStatusBarStyle();
								this.props.store!.emitSelectHomeBottomNav('project');
							}}
							onExit={this.popStatusBarStyle}
						/>
						<Scene
							key={'share'}
							hideNavBar
							component={Share}
							share
							onEnter={() => {
								this.pushCommonStatusBarStyle();
								this.props.store!.emitSelectHomeBottomNav('share');
							}}
							onExit={this.popStatusBarStyle}
						/>
						<Scene
							key={'feedback'}
							hideNavBar
							component={Feedback}
							share
							onEnter={() => {
								this.pushCommonStatusBarStyle();
								this.props.store!.emitSelectHomeBottomNav('feedback');
							}}
							onExit={this.popStatusBarStyle}
						/>
						<Scene
							key={'search'}
							hideNavBar
							component={Search}
							share
							onEnter={() => {
								StatusBar.pushBackgroundColor('#fff');
								StatusBar.pushBarStyle('dark-content');
								this.props.store!.emitSelectHomeBottomNav('search');
							}}
							onExit={this.popStatusBarStyle}
						/>
						<Scene
							key={'me'}
							hideNavBar
							component={Me}
							share
							onEnter={() => {
								this.pushUserBlueStatusBar();
								this.props.store!.emitSelectHomeBottomNav('me');
							}}
							onExit={this.popStatusBarStyle}
						/>
					</Tabs>
					<Scene
						key={'projectPage'}
						component={ProjectPage}
						onEnter={this.pushArticleStatusBarStyle}
						onExit={this.popStatusBarStyle}
					/>
					<Scene
						key={'sharePage'}
						component={SharePage}
						onEnter={this.pushArticleStatusBarStyle}
						onExit={this.popStatusBarStyle}
					/>
					<Scene
						key={'feedbackPage'}
						component={FeedbackPage}
						onEnter={this.pushArticleStatusBarStyle}
						onExit={this.popStatusBarStyle}
					/>
					<Scene
						key={'editArticle'}
						component={EditArticle}
						onEnter={this.pushArticleStatusBarStyle}
						onExit={this.popStatusBarStyle}
					/>
					<Scene
						key={'doc'}
						component={Doc}
						onEnter={this.pushArticleStatusBarStyle}
						onExit={this.popStatusBarStyle}
					/>
					<Scene
						key={'login'}
						component={Login}
						onEnter={this.pushCommonStatusBarStyle}
						onExit={this.popStatusBarStyle}
					/>
					<Scene
						key={'reg'}
						component={Reg}
						onEnter={this.pushCommonStatusBarStyle}
						onExit={this.popStatusBarStyle}
					/>
					<Scene
						key={'user'}
						component={User}
						onEnter={(props: any) => {
							this.pushUserBlueStatusBar();
							if (this.props.store!.me && this.props.store!.me!.id === props.id) {
								Actions.jump('me');
								this.props.store!.emitSelectHomeBottomNav('me');
							}
						}}
						onExit={this.popStatusBarStyle}
					/>
					<Scene
						key={'uploadAvatar'}
						component={UploadAvatar}
						onEnter={(props: any) => {
							this.pushBlackStatusBarStyle();
							if (!this.props.store!.me) {
								Actions.login();
							}
						}}
						onExit={this.popStatusBarStyle}
					/>
					<Scene
						key={'updatePassword'}
						component={UpdatePassword}
						onEnter={(props: any) => {
							this.pushCommonStatusBarStyle();
							if (!this.props.store!.me) {
								Actions.login();
							}
						}}
						onExit={this.popStatusBarStyle}
					/>
					<Scene
						key={'myArticles'}
						component={MyArticles}
						onEnter={this.pushArticleStatusBarStyle}
						onExit={this.popStatusBarStyle}
					/>
					<Scene
						key={'myFavorite'}
						component={MyFavorite}
						onEnter={(props: any) => {
							this.pushArticleStatusBarStyle();
							if (!this.props.store!.me) {
								Actions.login();
							}
						}}
						onExit={this.popStatusBarStyle}
					/>
					<Scene
						key={'friends'}
						component={Friends}
						onEnter={this.pushArticleStatusBarStyle}
						onExit={this.popStatusBarStyle}
					/>
					<Scene
						key={'message'}
						component={Message}
						onEnter={this.pushArticleStatusBarStyle}
						onExit={this.popStatusBarStyle}
					/>
					<Scene
						key={'sendMessage'}
						component={SendMessage}
						onEnter={this.pushArticleStatusBarStyle}
						onExit={this.popStatusBarStyle}
					/>
				</Stack>
			</Router>
		);
	}

	private exit: boolean = false;
	private doubleBackThenExit = () => {
		const currentScene = (Actions.currentScene as string).substring(1);
		if (
			currentScene === 'project' ||
			currentScene === 'share' ||
			currentScene === 'feedback' ||
			currentScene === 'me'
		) {
			if (this.exit) {
				BackHandler.exitApp();
				return true;
			}
			this.exit = true;
			Toast.info('再按退出', 2, () => {
				this.exit = false;
			});
			return true;
		}
		return false;
	};

	private pushCommonStatusBarStyle = () => {
		StatusBar.pushBarStyle('dark-content');
		StatusBar.pushBackgroundColor(BACK_WHITE);
	};

	private pushUserBlueStatusBar = () => {
		StatusBar.pushBarStyle('light-content');
		StatusBar.pushBackgroundColor(ICON_BLUE);
	};

	private pushArticleStatusBarStyle = () => {
		StatusBar.pushBarStyle('light-content');
		StatusBar.pushBackgroundColor(ICON_BLUE);
	};

	private pushBlackStatusBarStyle = () => {
		StatusBar.pushBarStyle('light-content');
		StatusBar.pushBackgroundColor('#000');
	};

	private popStatusBarStyle = () => {
		StatusBar.popBackgroundColor();
		StatusBar.popBarStyle();
	};

	constructor(props: any) {
		super(props);

		PushNotificationHandler.configure({
			popInitialNotification: true,
			requestPermissions: true,
			onNotification: (notification) => {
				// process the notification
				let msg = notification.message.toString();
				if (msg.includes('私信')) {
					MyRouter.message();
				} else if (msg.includes('粉丝')) {
					MyRouter.friends('fans');
				} else if (msg.includes('@')) {
					MyRouter.me(true);
					setTimeout(() => {
						this.props.store!.emitToReferMe();
					}, 300);
				}
				const i = this.props.store!.reminds.findIndex(msg);
				i !== -1 && this.props.store!.reminds.splice(i);
				// required on iOS only (see fetchCompletionHandler docs: https://facebook.github.io/react-native/docs/pushnotificationios.html)
				notification.finish(PushNotificationIOS.FetchResult.NoData);
			}
		});
 
	}

	close?: IReactionDisposer;

	componentDidMount() {
		this.close = autorun(() => {
			this.props.store!.reminds.mapWithoutNotifed((remind, i) => {
				PushNotificationHandler.localNotification({
					message: remind.text,
					playSound: false
				});
				this.props.store!.reminds.noti(i);
			});
		});
		setInterval(async () => {
			this.props.store!.me && this.props.store!.parseRemids(cheerio.load(await req.GET_HTML('/my')));
		}, __DEV__ ? 1000 * 30 : 1000 * 60 * 1);		
	}

	componentWillUnmount() {
		this.close && this.close();
	}
}
