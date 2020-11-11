import AnalyzeActions from '../../actions/AnalyzeActions';
import OutsourceContainer from '../outsource/OutsourceContainer';


class AnalyzeChunksResume extends React.Component {

	constructor(props) {
		super(props);
		this.payableValues = [];
		this.payableValuesChenged = [];
		this.containers = {};
		this.state = {
			openDetails: false,
			openOutsource: false,
			outsourceJobId: null
		}

		this.jobLinkRef = {}
	}


	showDetails = (idJob) => (evt) => {
		if ($(evt.target).parents('.outsource-container').length === 0) {
			evt.preventDefault();
			evt.stopPropagation();
			AnalyzeActions.showDetails(idJob);
			this.setState({
				openDetails: true
			});
		}


	}
	openSplitModal = (id) => (e) => {
		e.stopPropagation();
		e.preventDefault();
		const {project} = this.props;
		let job = project.get('jobs').find((item) => {
			return item.get('id') == id;
		});
		console.log(id)
		ModalsActions.openSplitJobModal(job, project, UI.reloadAnalysis);
	}

	openMergeModal = (id) => (e) => {
		e.stopPropagation();
		e.preventDefault();
		const {project} = this.props;
		let job = this.props.project.get('jobs').find((item) => {
			return item.get('id') == id;
		});
		ModalsActions.openMergeModal(project.toJS(), job.toJS(), UI.reloadAnalysis);
	}

	thereIsChunkOutsourced = () => {
		const {idJob} = this.props;
		let outsourceChunk = this.props.project.get('jobs').find((item) => {
			return !!(item.get('outsource')) && item.get('id') === idJob;
		});
		return !_.isUndefined(outsourceChunk)
	}

	getTranslateUrl = (job, index) => {
		let chunk_id = (index) ? index : job.get('id');
		return '/translate/' + this.props.project.get('project_slug') + '/' + job.get('source') + '-' + job.get('target') + '/' + chunk_id + '-' + job.get('password') + (index ? '#' + job.get('job_first_segment') : '');
	}

	openOutsourceModal = (idJob) => (e) => {
		e.stopPropagation();
		e.preventDefault();
		this.setState({
			openOutsource: true,
			outsourceJobId: idJob
		});
	}

	closeOutsourceModal = () => {
		this.setState({
			openOutsource: false,
			outsourceJobId: null
		});
	}

	checkPayableChanged = (idJob, payable) => {
		if (this.payableValues[idJob] && payable !== this.payableValues[idJob]) {
			this.payableValuesChenged[idJob] = true;
		}
		this.payableValues[idJob] = payable;
	}

	copyJobLinkToClipboard = (jid) =>(e) => {
		e.stopPropagation();
		this.jobLinkRef[jid].select();
		this.jobLinkRef[jid].setSelectionRange(0, 99999);
		setTimeout(() => {
			$('.ui.icon.button.copy').popup('hide');
		}, 3000)
		document.execCommand("copy");
	}

	goToTranslate = (chunk, index, e) => {
		e.preventDefault();
		e.stopPropagation();
		window.open(this.getTranslateUrl(chunk, index), "_blank")
	}

	getDirectOpenButton = (chunk, index) => {
		return <div className="open-translate ui primary button open"
					onClick={(e) => {
						this.goToTranslate(chunk, index, e)
					}}>Translate</div>;
	}


	getUrl = (job, index) => {
		let chunk_id = (index) ? job.get('id') + '-' + index : job.get('id');
		return window.location.protocol + '//' + window.location.host + '/translate/' + this.props.project.get('project_slug') + '/' + job.get('source') + '-' + job.get('target') + '/' + chunk_id + '-' + job.get('password') + (index ? '#' + job.get('job_first_segment') : '');
	}

	getResumeJobs = () => {
		const {copyJobLinkToClipboard, thereIsChunkOutsourced} = this;
		const {status, jobsAnalysis, jobsInfo} = this.props;

		let buttonsClass = (status !== "DONE" || thereIsChunkOutsourced()) ? 'disabled' : '';
		if (!jobsAnalysis.isEmpty()) {
			return _.map(jobsInfo, (item, indexJob) => {
				let tmpJobAnalysis = jobsAnalysis.get(indexJob);

				if (item.splitted !== "" && _.size(item.chunks) > 1) {
					let chunksHtml = _.map(item.chunks, (chunkConfig, index) => {
						let indexChunk = chunkConfig.jpassword;
						let chunkAnalysis = tmpJobAnalysis.get('totals').get(indexChunk);
						let chunk = chunkConfig;
						let chunkJob = this.props.project.get('jobs').find((job) => {
							return job.get('id') == chunk.jid && job.get('password') === chunk.jpassword;
						});
						index++;

						let openOutsource = (this.state.openOutsource && this.state.outsourceJobId === (chunk.jid + '-' + index));

						this.checkPayableChanged(chunk.jid + index, chunkAnalysis.get('TOTAL_PAYABLE').get(1));

						let openOutsourceClass = (openOutsource) ? 'openOutsource' : '';
						const jidChunk = `${chunk.jid}-${index}`

						return <div key={indexChunk} className={"chunk ui grid shadow-1 " + openOutsourceClass}
									onClick={this.showDetails(chunk.jid)}>
							<div className="title-job splitted">
								<div className="job-id">{'Chunk ' + index}</div>
								<div className={'translate-url'}>
									<input ref={(el) => this.jobLinkRef[jidChunk] = el} type="text" readOnly
										   value={this.getUrl(chunkJob, index)} onClick={ (e) => e.stopPropagation()}/>
									<button onClick={copyJobLinkToClipboard(jidChunk)} className={'ui icon button copy'}
											data-content="Copied to Clipboard!" data-position="top center">
										<i className="icon-link icon"/></button>
								</div>
							</div>
							<div className="titles-compare">
								<div className="title-total-words ttw">
									<div>{chunk.total_raw_word_count_print}</div>
								</div>
								<div className="title-standard-words tsw">
									<div>{chunkAnalysis.get('standard_word_count').get(1)}</div>
								</div>
								<div className="title-matecat-words tmw"
									 ref={(container) => this.containers[chunk.jid + index] = container}>
									<div>
										{chunkAnalysis.get('TOTAL_PAYABLE').get(1)}</div>
								</div>
							</div>
							<div className="activity-icons">
								<div className={'activity-button splitted'}>
									{/*{self.getOpenButton(chunkJob.toJS(), chunk.jid + '-' + index)}*/}
									{this.getDirectOpenButton(chunkJob, chunk.jid + '-' + index)}
								</div>
							</div>
							<OutsourceContainer project={this.props.project}
												job={chunkJob}
												standardWC={chunkAnalysis.get('standard_word_count').get(1)}
												url={this.getTranslateUrl(chunkJob, index)}
												showTranslatorBox={false}
												extendedView={true}
												showOpenBox={true}
												onClickOutside={this.closeOutsourceModal}
												openOutsource={openOutsource}
												idJobLabel={chunk.jid + '-' + index}
												outsourceJobId={this.state.outsourceJobId}
							/>
						</div>;
					});

					return <div key={indexJob} className="job ui grid">
						<div className="chunks sixteen wide column">

							<div className="chunk ui grid shadow-1"
								 onClick={this.showDetails(this.props.jobsInfo[indexJob].jid)}>
								<div className="title-job heading splitted">
									<div className="job-info">
										<div className="job-id">ID: {this.props.jobsInfo[indexJob].jid}</div>
										<div className="source-target">
											<div className="source-box">{this.props.jobsInfo[indexJob].source}</div>
											<div className="in-to"><i className="icon-chevron-right icon"/></div>
											<div className="target-box">{this.props.jobsInfo[indexJob].target}</div>
										</div>
									</div>
								</div>

								<div className="activity-icons splitted">
									<div className="merge ui blue basic button"
										 onClick={this.openMergeModal(this.props.jobsInfo[indexJob].jid)}><i
										className="icon-compress icon"/>Merge
									</div>
								</div>
							</div>
							{chunksHtml}
						</div>
					</div>;
				} else {
					let obj = this.props.jobsInfo[indexJob].chunks[0];
					let password = obj.jpassword;
					let total_raw = obj.total_raw_word_count_print;
					let total_standard = (tmpJobAnalysis.get('totals').first().get('standard_word_count')) ?
						tmpJobAnalysis.get('totals').first().get('standard_word_count').get(1) : 0;

					let chunkJob = this.props.project.get('jobs').find((job) => {
						return job.get('id') == this.props.jobsInfo[indexJob].jid && job.get('password') === password;
					});

					let openOutsource = (this.state.openOutsource && this.state.outsourceJobId === this.props.jobsInfo[indexJob].jid);
					let openOutsourceClass = (openOutsource) ? 'openOutsource' : '';

					this.checkPayableChanged(this.props.jobsInfo[indexJob].jid,
						tmpJobAnalysis.get('totals').first().get('TOTAL_PAYABLE').get(1));

					return <div key={indexJob} className="job ui grid">
						<div className="chunks sixteen wide column">
							<div className={"chunk ui grid shadow-1 " + openOutsourceClass}
								 onClick={this.showDetails(this.props.jobsInfo[indexJob].jid)}>
								<div className="title-job">
									<div className="job-info">
										<div className="job-id">ID: {this.props.jobsInfo[indexJob].jid}</div>
										<div className="source-target">
											<div
												className="source-box no-split">{this.props.jobsInfo[indexJob].source}</div>
											<div className="in-to"><i className="icon-chevron-right icon"/></div>
											<div
												className="target-box no-split">{this.props.jobsInfo[indexJob].target}</div>
										</div>
									</div>
									<div className={'translate-url'}>
										<input type="text" readOnly value={this.getUrl(chunkJob)}
											   ref={(el) => this.jobLinkRef[this.props.jobsInfo[indexJob].jid] = el}
											   onClick={ (e) => e.stopPropagation()}/>
										<button
											onClick={copyJobLinkToClipboard(this.props.jobsInfo[indexJob].jid)} className={'ui icon button copy'}
											data-content="Copied to Clipboard!" data-position="top center">
											<i className="icon-link icon"/></button>
									</div>
								</div>
								<div className="titles-compare">
									<div className="title-total-words ttw">
										{/*<div className="cell-label">Total words:</div>*/}
										<div>{total_raw}</div>
									</div>
									<div className="title-standard-words tsw">
										{/*<div className="cell-label">Other CAT tool</div>*/}
										<div>{total_standard}</div>
									</div>
									<div className="title-matecat-words tmw"
										 ref={(container) => this.containers[this.props.jobsInfo[indexJob].jid] = container}>
										{/*<div className="cell-label" >Weighted words:</div>*/}
										<div>
											{/*<i className="icon-chart4 icon"/>*/}
											{tmpJobAnalysis.get('totals').first().get('TOTAL_PAYABLE').get(1)}</div>
									</div>
								</div>
								<div className="activity-icons">
									<div className="activity-button">
										{(!config.jobAnalysis && config.splitEnabled) ? (
											<div className={"split ui blue basic button " + buttonsClass + ' '}
												 onClick={this.openSplitModal(this.props.jobsInfo[indexJob].jid)}>
												<i className="icon-expand icon"/>Split</div>

										) : (null)}
										{/*{this.getOpenButton(chunkJob.toJS(), this.props.jobsInfo[indexJob].jid)}*/}
										{this.getDirectOpenButton(chunkJob)}
									</div>
								</div>

							</div>
							<OutsourceContainer project={this.props.project}
												job={chunkJob}
												url={this.getTranslateUrl(chunkJob)}
												standardWC={total_standard}
												showTranslatorBox={false}
												extendedView={true}
												showOpenBox={true}
												onClickOutside={this.closeOutsourceModal}
												openOutsource={openOutsource}
												idJobLabel={this.props.jobsInfo[indexJob].jid}
												outsourceJobId={this.state.outsourceJobId}/>
						</div>
					</div>
				}
			});
		} else {
			return this.props.project.get('jobs').map((jobInfo, indexJob) => {
				return <div key={jobInfo.get('id') + '-' + indexJob} className="job ui grid">
					<div className="chunks sixteen wide column">
						<div className="chunk ui grid shadow-1">
							<div className="title-job no-split">
								<div className="source-target">
									<div className="source-box no-split">{jobInfo.get('sourceTxt')}</div>
									<div className="in-to"><i className="icon-chevron-right icon"/></div>
									<div className="target-box no-split">{jobInfo.get('targetTxt')}</div>
								</div>
							</div>
							<div className="titles-compare">
								<div className="title-total-words ttw">
									<div>0</div>
								</div>
								<div className="title-standard-words tsw">
									<div>0</div>
								</div>
								<div className="title-matecat-words tmw">
									<div>0</div>
								</div>
							</div>
							<div className="activity-icons"/>
						</div>

					</div>
				</div>
			});
		}
	}

	openAnalysisReport =(e) => {
		e.preventDefault();
		e.stopPropagation();
		this.props.openAnalysisReport();
		this.setState({
			openDetails: !this.state.openDetails
		});
	}

	componentDidUpdate() {
		let changedData = _.pick(this.payableValuesChenged, (item, i, array) => {
			return item === true;
		});
		if (_.size(changedData) > 0) {
			_.each(changedData, (item, i) => {
				this.containers[i].classList.add('updated-count');
				setTimeout(() => {
					this.containers[i].classList.remove('updated-count');
				}, 400)
			})
		}
	}

	componentDidMount() {
		if (this.props.status === 'DONE') {
			_.each(self.containers, (item, i) => {
				this.classList.add('updated-count');
				setTimeout(() => {
					this.containers[i].classList.remove('updated-count');
				}, 400)
			})
		}

		$('.ui.icon.button.copy').popup({
			on: 'click',
			hideOnScroll: true
		});
	}

	componentWillUnmount() {
	}

	shouldComponentUpdate(nextProps, nextState) {
		return (!nextProps.jobsAnalysis.equals(this.props.jobsAnalysis) ||
			nextProps.status !== this.props.status ||
			nextState.openDetails !== this.state.openDetails ||
			nextState.outsourceJobId !== this.state.outsourceJobId ||
			!nextProps.project.equals(this.props.project)
		)

	}

	render() {
		let showHideText = (this.state.openDetails) ? "Hide Details" : "Show Details";
		let iconClass = (this.state.openDetails) ? "open" : "";
		let html = this.getResumeJobs()
		return <div className="project-top ui grid">
			<div className="compare-table sixteen wide column">
				<div className="header-compare-table ui grid shadow-1">
					<div className="title-job">
						<h5/>
						<p/>
					</div>
					<div className="titles-compare">
						{!config.isCJK ? (
							<div className="title-total-words">
								<h5>Total word count</h5>
							</div>
						) : (
							<div className="title-total-words">
								<h5>Total character count</h5>
							</div>
						)}
						<div className="title-standard-words">
							<h5>Industry weighted
								<span data-tooltip="As counted by other CAT tools">
                                    <i className="icon-info icon"/>
                                </span>
							</h5>
						</div>
						<div className="title-total-words">
							<h5>Total payable words</h5>
						</div>
					</div>
				</div>
			</div>
			<div className="compare-table jobs sixteen wide column">

				{html}

			</div>
			{(!this.props.jobsAnalysis.isEmpty()) ? (
				<div className="analyze-report"
					 onClick={this.openAnalysisReport}>
					<div>
						<h3>{showHideText}</h3>
						<div className="rounded">
							<i className={"icon-sort-down icon " + iconClass}/>
						</div>
					</div>
				</div>
			) : (null)}

		</div>;


	}
}

export default AnalyzeChunksResume;
