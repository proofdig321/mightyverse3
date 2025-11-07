# 🤖 AGENT COORDINATION PROTOCOL

## MCP Integration Strategy

### Agent Hierarchy
```
Strategic Coordinator (Claude)
├── Implementation Agent (Amazon Q)
├── Specialized Agents (Mission-based)
└── Human Approval (You)
```

### Coordination Patterns

#### 1. Sequential Coordination
```
rbac → admin-dashboard → campaigns
```
- Each agent waits for predecessor completion
- Outputs become inputs for next agent
- Human approval gates between phases

#### 2. Parallel Coordination
```
animator-dashboard ║ admin-dashboard
                   ║
                   ╚═══ campaigns
```
- Independent agents work simultaneously
- Converge at integration points
- Reduces overall timeline

#### 3. Dependency Coordination
```
asset-review → metadata-gen → mint-approval
     ↓              ↓
ad-placement → campaigns
```
- Complex dependency chains
- Requires careful sequencing
- Failure propagation management

## Agent Communication Protocol

### Data Handoff Format
```json
{
  "agent_id": "asset-review",
  "output_type": "metadata_suggestion",
  "data_location": "ipfs://Qm...",
  "next_agent": "metadata-gen",
  "human_review_required": true,
  "confidence_score": 0.85
}
```

### Status Updates
- Agents update `/docs/MISSION_STATUS.md`
- Human approval tracked in git commits
- Failures logged with recovery steps

## Human-in-Loop Checkpoints

### Critical Approval Points
1. **RBAC Security Model** - Security review required
2. **Admin Dashboard UI** - UX approval needed
3. **AI Confidence Thresholds** - Business logic validation
4. **Contract Deployment** - Financial risk assessment
5. **Production Minting** - Final authorization

### Approval Workflow
```
Agent Output → PR Created → Human Review → Approval/Rejection → Merge/Iterate
```

## Error Handling & Recovery

### Agent Failure Modes
- **Dependency Missing** - Wait for prerequisite
- **API Timeout** - Retry with backoff
- **Validation Failed** - Human intervention required
- **Resource Exhausted** - Scale or defer

### Recovery Strategies
- Automatic retry for transient failures
- Human escalation for critical issues
- Rollback to last known good state
- Alternative agent assignment

## Quality Gates

### Before Mission Assignment
- [ ] Dependencies satisfied
- [ ] Resources available
- [ ] Success criteria defined
- [ ] Human reviewer assigned

### Before Mission Completion
- [ ] Outputs validated
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Human approval obtained

---

*This protocol ensures coordinated, reliable agent collaboration while maintaining human oversight.*