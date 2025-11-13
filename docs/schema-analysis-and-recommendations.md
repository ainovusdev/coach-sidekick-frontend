# Backend Schema Analysis & Recommendations

## Current State Analysis

### Hierarchy Overview

Based on your requirements:

- **Goals**: Top level (3-12 months long-term outcomes)
- **Outcomes (Targets)**: Linked to 1+ goals
- **Sprints**: Linked to 1+ outcomes
- **Commitments**: Linked to 1+ sprints, outcomes, and goals

### Current Database Structure

#### 1. Goals (`client_goals` table)

```python
ClientGoal
  - id (PK)
  - client_id (FK → clients)
  - title, description, category
  - status, progress, target_date
  - Relationships:
    - targets (via Target.goal_id)
    - sprints (via Sprint.goal_id) ← REDUNDANT
    - commitments (via Commitment.goal_id) ← REDUNDANT
```

#### 2. Outcomes/Targets (`targets` table)

```python
Target
  - id (PK)
  - goal_id (FK → client_goals) ← Single goal only
  - sprint_id (FK → sprints) ← Single sprint only
  - title, description, status, progress_percentage
  - Relationships:
    - commitment_links (many-to-many via CommitmentTargetLink)
```

#### 3. Sprints (`sprints` table)

```python
Sprint
  - id (PK)
  - client_id (FK → clients)
  - goal_id (FK → client_goals) ← REDUNDANT
  - sprint_number, title, description
  - start_date, end_date, status
  - Relationships:
    - targets (via Target.sprint_id)
    - commitments (via Commitment.sprint_id) ← REDUNDANT
```

#### 4. Commitments (`commitments` table)

```python
Commitment
  - id (PK)
  - client_id (FK → clients)
  - session_id (FK → coaching_sessions)
  - sprint_id (FK → sprints) ← REDUNDANT (should use outcomes)
  - goal_id (FK → client_goals) ← REDUNDANT (should use outcomes)
  - title, description, type, status, priority
  - commit_metadata (JSONB) ← Currently storing linked_goal_ids, linked_sprint_ids arrays
  - Relationships:
    - target_links (many-to-many via CommitmentTargetLink) ← CORRECT
```

#### 5. Junction Table (`commitment_target_links`)

```python
CommitmentTargetLink
  - id (PK)
  - commitment_id (FK → commitments)
  - target_id (FK → targets)
  - Enables: Commitments ↔ Outcomes (many-to-many)
```

---

## Problems Identified

### 🔴 Critical Issues

1. **Direct Links Bypass Hierarchy**
   - `Sprint.goal_id` creates direct Goal → Sprint link (should go through Outcomes)
   - `Commitment.sprint_id` and `Commitment.goal_id` create direct links (should go through Outcomes)
   - This creates multiple paths to relate entities, causing data inconsistency

2. **Single Relationship Constraints**
   - `Target.goal_id` is a single FK (requirement: outcomes linked to 1+ goals)
   - `Target.sprint_id` is a single FK (requirement: sprints linked to 1+ outcomes)

3. **Metadata Workaround**
   - Using `commit_metadata` JSONB field to store `linked_goal_ids` and `linked_sprint_ids` arrays
   - This is a workaround for missing many-to-many relationships
   - Hard to query, no referential integrity, no cascade deletes

### 🟡 Design Issues

4. **Three Ways to Link Commitments**

   ```
   Commitment → Goal:
     - Via Outcomes (correct): commitment.target_links → target.goal_id
     - Direct FK (redundant): commitment.goal_id
     - Metadata array (workaround): commit_metadata.linked_goal_ids

   Commitment → Sprint:
     - Via Outcomes (correct): commitment.target_links → target.sprint_id
     - Direct FK (redundant): commitment.sprint_id
     - Metadata array (workaround): commit_metadata.linked_sprint_ids
   ```

5. **Filtering Logic Complexity**
   - Frontend code checks 3 different places for relationships
   - Prone to bugs and inconsistencies
   - Performance overhead checking multiple paths

---

## Recommended Schema Changes

### Option A: Proper Many-to-Many (Recommended)

**Add junction tables for proper many-to-many relationships:**

#### 1. Goals ↔ Outcomes (Many-to-Many)

```python
# New table: target_goal_links
class TargetGoalLink(Base):
    __tablename__ = "target_goal_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_id = Column(UUID(as_uuid=True), ForeignKey('targets.id', ondelete='CASCADE'), nullable=False)
    goal_id = Column(UUID(as_uuid=True), ForeignKey('client_goals.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    target = relationship("Target", backref="goal_links")
    goal = relationship("ClientGoal", backref="target_links")
```

**Migration steps:**

- Create `target_goal_links` table
- Migrate existing `Target.goal_id` → `target_goal_links.goal_id`
- Drop `Target.goal_id` column
- Update relationships in `Target` model

#### 2. Sprints ↔ Outcomes (Many-to-Many)

```python
# New table: target_sprint_links
class TargetSprintLink(Base):
    __tablename__ = "target_sprint_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_id = Column(UUID(as_uuid=True), ForeignKey('targets.id', ondelete='CASCADE'), nullable=False)
    sprint_id = Column(UUID(as_uuid=True), ForeignKey('sprints.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    target = relationship("Target", backref="sprint_links")
    sprint = relationship("Sprint", backref="target_links")
```

**Migration steps:**

- Create `target_sprint_links` table
- Migrate existing `Target.sprint_id` → `target_sprint_links.sprint_id`
- Drop `Target.sprint_id` column
- Update relationships in `Target` model

#### 3. Remove Redundant Direct Links

```python
# In Sprint model:
- Remove: goal_id column
- Remove: goal relationship
- Remove: commitments relationship

# In Commitment model:
- Remove: sprint_id column
- Remove: goal_id column
- Remove: sprint relationship
- Remove: goal relationship
- Remove: linked_goal_ids and linked_sprint_ids from commit_metadata
```

**Migration steps:**

- Data migration: Move any commitments using direct links to use outcomes instead
- Drop `Sprint.goal_id`, `Commitment.sprint_id`, `Commitment.goal_id` columns

---

### Option B: Keep Current + Cleanup (Simpler Migration)

**If migration complexity is a concern, at minimum:**

1. **Remove redundant direct links**
   - Drop `Sprint.goal_id` (sprints relate to goals via outcomes)
   - Drop `Commitment.sprint_id` and `Commitment.goal_id` (commitments relate via outcomes)

2. **Keep metadata workaround temporarily**
   - Continue using `commit_metadata.linked_goal_ids` and `linked_sprint_ids`
   - Document this as tech debt for future refactoring

3. **Keep single FKs in Targets table**
   - Keep `Target.goal_id` and `Target.sprint_id` as single FKs
   - Accept limitation of "1 goal per outcome, 1 sprint per outcome"
   - Adjust requirement to match implementation

**Pros:**

- Minimal migration effort
- No data loss risk
- Can be done incrementally

**Cons:**

- Doesn't fully meet "1+ goals/sprints" requirement
- Metadata arrays still have no referential integrity
- Filtering logic remains complex

---

## Proposed Final Schema (Option A)

```
┌─────────────┐
│  ClientGoal │ (Top Level - Long-term 3-12 months)
│  id         │
│  client_id  │
│  title      │
└──────┬──────┘
       │
       │ Many-to-Many via target_goal_links
       ↓
┌─────────────┐
│   Target    │ (Outcomes - Short-term wins)
│   id        │
│   title     │
└──────┬──────┘
       │
       ├─ Many-to-Many via target_sprint_links → Sprint
       │
       └─ Many-to-Many via commitment_target_links → Commitment


┌─────────────┐
│   Sprint    │ (6-8 week timeboxed periods)
│   id        │
│   client_id │
│   title     │
│   start/end │
└─────────────┘
       ↑
       │ Many-to-Many via target_sprint_links
       │
   (relates to Outcomes, not Goals directly)


┌─────────────┐
│ Commitment  │ (Actionable tasks)
│ id          │
│ client_id   │
│ session_id  │
│ title       │
│ status      │
└─────────────┘
       ↑
       │ Many-to-Many via commitment_target_links
       │
   (relates to Outcomes only)
```

---

## Migration Plan (Option A)

### Phase 1: Add Junction Tables

```bash
# Create migration
alembic revision -m "add_many_to_many_junction_tables"
```

**Migration code:**

```python
def upgrade():
    # 1. Create target_goal_links table
    op.create_table(
        'target_goal_links',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('target_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('goal_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['target_id'], ['targets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['goal_id'], ['client_goals.id'], ondelete='CASCADE'),
    )

    # 2. Create target_sprint_links table
    op.create_table(
        'target_sprint_links',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('target_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sprint_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['target_id'], ['targets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sprint_id'], ['sprints.id'], ondelete='CASCADE'),
    )

    # 3. Migrate existing Target.goal_id relationships
    op.execute("""
        INSERT INTO target_goal_links (id, target_id, goal_id, created_at)
        SELECT gen_random_uuid(), id, goal_id, NOW()
        FROM targets
        WHERE goal_id IS NOT NULL
    """)

    # 4. Migrate existing Target.sprint_id relationships
    op.execute("""
        INSERT INTO target_sprint_links (id, target_id, sprint_id, created_at)
        SELECT gen_random_uuid(), id, sprint_id, NOW()
        FROM targets
        WHERE sprint_id IS NOT NULL
    """)
```

### Phase 2: Remove Redundant Columns

```python
def upgrade():
    # Drop direct FK columns from targets
    op.drop_constraint('targets_goal_id_fkey', 'targets', type_='foreignkey')
    op.drop_column('targets', 'goal_id')

    op.drop_constraint('targets_sprint_id_fkey', 'targets', type_='foreignkey')
    op.drop_column('targets', 'sprint_id')

    # Drop redundant columns from sprints
    op.drop_constraint('sprints_goal_id_fkey', 'sprints', type_='foreignkey')
    op.drop_column('sprints', 'goal_id')

    # Drop redundant columns from commitments
    op.drop_constraint('commitments_sprint_id_fkey', 'commitments', type_='foreignkey')
    op.drop_column('commitments', 'sprint_id')

    op.drop_constraint('commitments_goal_id_fkey', 'commitments', type_='foreignkey')
    op.drop_column('commitments', 'goal_id')
```

### Phase 3: Update Models

Update SQLAlchemy models to use new relationships:

```python
# In Target model:
class Target(Base):
    # Remove:
    # goal_id = Column(...)
    # sprint_id = Column(...)

    # Add:
    goal_links = relationship("TargetGoalLink", back_populates="target", cascade="all, delete-orphan")
    sprint_links = relationship("TargetSprintLink", back_populates="target", cascade="all, delete-orphan")

    @property
    def goals(self):
        """Get all linked goals"""
        return [link.goal for link in self.goal_links]

    @property
    def sprints(self):
        """Get all linked sprints"""
        return [link.sprint for link in self.sprint_links]

# In Sprint model:
class Sprint(Base):
    # Remove:
    # goal_id = Column(...)
    # goal = relationship(...)
    # commitments = relationship(...)

    # Keep:
    target_links = relationship("TargetSprintLink", back_populates="sprint")

# In Commitment model:
class Commitment(Base):
    # Remove:
    # sprint_id = Column(...)
    # goal_id = Column(...)
    # sprint = relationship(...)
    # goal = relationship(...)
```

### Phase 4: Update Services & Schemas

Update Pydantic schemas:

```python
# Remove from CommitmentCreate/Update:
# goal_id, sprint_id fields

# Remove from metadata:
# linked_goal_ids, linked_sprint_ids

# Add to TargetCreate:
class TargetCreate(BaseModel):
    title: str
    description: Optional[str]
    goal_ids: List[UUID]  # Multiple goals
    sprint_ids: List[UUID]  # Multiple sprints
```

---

## Impact Assessment

### Breaking Changes

- API endpoints that accept/return `goal_id`, `sprint_id` on commitments
- Frontend forms that use direct goal/sprint selectors for commitments
- Filtering logic that checks `commitment.goal_id` or `commitment.sprint_id`

### Required Frontend Changes

1. Remove goal/sprint selectors from commitment form
2. Update commitment filtering to only use outcomes
3. Update tree view to traverse: Goal → Outcomes → Commitments
4. Update graph view to show proper hierarchy
5. Remove metadata-based filtering logic

### Benefits

- Single source of truth for relationships
- Proper referential integrity with cascade deletes
- Easier to query and filter
- Matches stated requirements (1+ goals/sprints)
- Eliminates tech debt

---

## Recommendation

**Go with Option A (Proper Many-to-Many)** because:

1. **Matches Requirements**: Your stated requirement is "1+ goals/sprints", which requires many-to-many
2. **Data Integrity**: Junction tables provide referential integrity and cascade deletes
3. **Simplifies Code**: Single path for relationships eliminates complex filtering logic
4. **Long-term Maintainability**: Removes tech debt of metadata workarounds
5. **Migration is Manageable**: Can be done in phases with zero data loss

**Timeline Estimate:**

- Phase 1 (Add junction tables): 2-3 hours
- Phase 2 (Remove redundant columns): 1 hour
- Phase 3 (Update models): 1-2 hours
- Phase 4 (Update services/schemas/frontend): 4-6 hours
- Testing: 2-3 hours
- **Total: 1-2 days**

**Alternative:** Start with Option B to quickly reduce redundancy, then upgrade to Option A when time permits.
